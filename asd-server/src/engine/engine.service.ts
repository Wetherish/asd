import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeService } from "../realtime/realtime.service";
import { LLMService } from "../llm/llm.service";
import type { Approval, Message } from "@prisma/client";
import { Approval as ApprovalDto, iso } from "../shared/contract";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Script = {
  text: string;
  trace: { agentId: string; title: string }[];
  approval?: { title: string; meta: string };
  artifact?: { kind: string; name: string; content: unknown };
};

type AgentContext = { name: string; description: string; capabilities: string[] } | null;

// Pluggable agent engine. Uses the configured LLM provider when available and
// falls back to a deterministic script (for offline dev / tests).
@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly llm: LLMService,
  ) {}

  async run(session: { id: string; leadAgentId: string }, message: Message, userText: string, userId: string): Promise<void> {
    const script = await this.resolveScript(session, userText, userId);
    try {
      for (const chunk of script.text.split(/(\s+)/)) {
        if (!chunk) continue;
        await delay(45);
        this.realtime.publish({
          type: "message.delta",
          data: { sessionId: session.id, messageId: message.id, delta: chunk },
        });
      }

      for (const t of script.trace) {
        await this.prisma.traceEntry.create({
          data: { messageId: message.id, agentId: t.agentId, title: t.title, status: "done" },
        });
      }

      let artifactRefs: { id: string; kind: string; name: string }[] = [];
      if (script.artifact) {
        const artifact = await this.prisma.artifact.create({
          data: {
            sessionId: session.id,
            kind: script.artifact.kind,
            name: script.artifact.name,
            authorId: session.leadAgentId,
            content: JSON.stringify(script.artifact.content),
          },
        });
        artifactRefs = [{ id: artifact.id, kind: artifact.kind, name: artifact.name }];
      }

      let approval: Approval | null = null;
      if (script.approval) {
        approval = await this.prisma.approval.create({
          data: {
            sessionId: session.id,
            messageId: message.id,
            title: script.approval.title,
            meta: script.approval.meta,
          },
        });
      }

      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: "complete",
          body: script.text,
          artifacts: artifactRefs.length ? JSON.stringify(artifactRefs) : undefined,
        },
      });

      this.realtime.publish({ type: "message.done", data: { sessionId: session.id, messageId: message.id } });

      if (approval) {
        this.realtime.publish({
          type: "approval.created",
          data: { approval: this.toApproval(approval) },
        });
      }
    } catch (err) {
      this.logger.error(`engine run failed for message ${message.id}`, err as Error);
      await this.prisma.message.update({ where: { id: message.id }, data: { status: "error" } });
      this.realtime.publish({
        type: "message.error",
        data: {
          sessionId: session.id,
          messageId: message.id,
          error: { code: "internal", message: "Agent failed to complete the turn" },
        },
      });
    }
  }

  // ---- script resolution (LLM with deterministic fallback) ----

  private async resolveScript(session: { id: string; leadAgentId: string }, userText: string, userId: string): Promise<Script> {
    if (await this.llm.enabled(userId)) {
      try {
        const agent = await this.prisma.agent.findUnique({ where: { id: session.leadAgentId } });
        const context: AgentContext = agent
          ? {
              name: agent.name,
              description: agent.description,
              capabilities: this.parseCapabilities(agent.capabilities),
            }
          : null;

        const generated = await this.llm.complete(
          userId,
          [
            { role: "system", content: this.systemPrompt(context) },
            { role: "user", content: userText },
          ],
          { json: true },
        );
        const parsed = this.parseScript(generated);
        if (parsed) return parsed;
        this.logger.warn("LLM returned an unparseable response — falling back");
      } catch (err) {
        this.logger.warn("LLM turn failed — using deterministic fallback", err as Error);
      }
    }
    return this.script(userText);
  }

  private parseCapabilities(raw: string): string[] {
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
    } catch {
      return [];
    }
  }

  private systemPrompt(agent: AgentContext): string {
    const name = agent?.name ?? "Assistant";
    const description = agent?.description ?? "";
    const capabilities = (agent?.capabilities ?? []).join(", ");
    return [
      `You are ${name}, an agent in a collaborative multi-agent workspace. ${description}`.trim(),
      capabilities ? `Capabilities: ${capabilities}.` : "",
      "You are the lead agent in this session. You may delegate work to sub-agents (Researcher, Builder, Planner, Reviewer); their work appears as a collapsible trace.",
      "If the request needs the user's sign-off (a purchase, sending a message, booking, publishing), include an approval with a clear title and a short meta line.",
      "Reply with ONLY valid JSON, no markdown fences, in exactly this shape:",
      '{"reply":"your message (1-3 sentences)","trace":[{"agentId":"builder","title":"what the sub-agent is doing"}],"approval":{"title":"Order the Shark RV1000?","meta":"£429 · delivers Thursday"}}',
      '"trace" and "approval" are optional. agentId must be one of: researcher, builder, planner, reviewer.',
    ]
      .filter(Boolean)
      .join("\n");
  }

  private parseScript(raw: string): Script | null {
    try {
      const obj = JSON.parse(this.extractJson(raw)) as {
        reply?: unknown;
        trace?: unknown;
        approval?: { title?: unknown; meta?: unknown };
      };
      if (typeof obj.reply !== "string" || !obj.reply.trim()) return null;

      const script: Script = { text: obj.reply.trim(), trace: [] };
      if (Array.isArray(obj.trace)) {
        script.trace = obj.trace
          .filter(
            (t): t is { agentId: string; title: string } =>
              !!t && typeof t.agentId === "string" && typeof t.title === "string",
          )
          .map((t) => ({ agentId: t.agentId, title: t.title }));
      }
      if (obj.approval && typeof obj.approval.title === "string") {
        script.approval = {
          title: obj.approval.title,
          meta: typeof obj.approval.meta === "string" ? obj.approval.meta : "",
        };
      }
      return script;
    } catch {
      return null;
    }
  }

  private extractJson(raw: string): string {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return fenced[1];
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) return raw.slice(start, end + 1);
    return raw;
  }

  private toApproval(a: Approval): ApprovalDto {
    return {
      id: a.id,
      sessionId: a.sessionId,
      messageId: a.messageId,
      title: a.title,
      meta: a.meta,
      kind: a.kind as ApprovalDto["kind"],
      status: a.status as ApprovalDto["status"],
      actions: (a.actions as unknown as string[]) ?? [],
      createdAt: iso(a.createdAt),
      decidedBy: a.decidedBy ?? undefined,
      decidedAt: a.decidedAt ? iso(a.decidedAt) : undefined,
    };
  }

  private script(userText: string): Script {
    const t = userText.toLowerCase();
    if (/(vacuum|buy|order|research|compare|shark|purchase)/.test(t)) {
      return {
        text: "Found three options in budget. The Shark RV1000 wins on a two-year warranty and price — my recommendation is below.",
        trace: [
          { agentId: "researcher", title: "Comparing in-budget options" },
          { agentId: "builder", title: "Pulling live prices & specs" },
        ],
        approval: { title: "Order the Shark RV1000?", meta: "£429 · delivers Thursday" },
        artifact: {
          kind: "table",
          name: "Shortlist",
          content: {
            kind: "table",
            columns: ["Model", "Price", "Warranty"],
            rows: [
              ["Shark RV1000", "£429", "2 yr"],
              ["Dyson V11", "£499", "1 yr"],
              ["Miele C3", "£389", "2 yr"],
            ],
          },
        },
      };
    }
    if (/(weekend|plan|schedule|calendar|trip|book)/.test(t)) {
      return {
        text: "Here's a plan for the weekend: Saturday for errands and a reservation, Sunday open. I've drafted it and it needs your go-ahead.",
        trace: [{ agentId: "planner", title: "Checking calendar & conflicts" }],
        approval: { title: "Book the Saturday reservation?", meta: "Calendar · 7:30 PM" },
      };
    }
    if (/(contract|read|review|doc|summari|clause)/.test(t)) {
      return {
        text: "I read the document and flagged three clauses worth attention. I've summarized them and left the full notes as an artifact.",
        trace: [{ agentId: "reviewer", title: "Reading & flagging clauses" }],
        approval: { title: "Send the summary to Priya?", meta: "Doc · ready to send" },
        artifact: {
          kind: "doc",
          name: "Notes",
          content: { kind: "doc", body: "# Notes\n- Clause 4.2 limits liability to 30 days\n- Clause 7.1 auto-renews annually" },
        },
      };
    }
    return {
      text: "Got it — I've captured that and queued it up. Let me know if you'd like me to go further.",
      trace: [{ agentId: "planner", title: "Capturing the request" }],
      approval: { title: "Proceed with this?", meta: "Action · ready" },
    };
  }
}
