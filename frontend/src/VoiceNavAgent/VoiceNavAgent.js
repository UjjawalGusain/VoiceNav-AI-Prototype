import { VDomHandler } from "../vdom/fullDom.js";
import { apis } from "../../api.js";

class VoiceNavAgent {
    constructor(sessionId, rootElement = document.body) {
        this.sessionId = sessionId;
        this.vdomHandler = new VDomHandler(rootElement);
        this.executionPipeline = [];
        this.currentStepIndex = 0;
        this.executionLog = [];
        this.dag_url =
            "https://storage.googleapis.com/voice_recording_bucket/dag_demo.json";
    }

    async planExecution(query, currentPath) {
        console.log("[AGENT] Starting planExecution for query:", query, " with path: ", currentPath);

        try {
            console.log(
                "[AGENT] Sending navigation plan request to:",
                apis.navigate
            );
            const resp = await fetch(apis.navigate, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    dag_url: this.dag_url,
                    currentPath: currentPath,
                    query,
                }),
            });
            console.log(
                "[AGENT] Navigation plan response status:",
                resp.status
            );
            const data = await resp.json();
            console.log("[AGENT] Navigation plan response data:", data);

            if (data.status !== "success" || !data.navigation_plan) {
                console.error("[AGENT] Failed to get execution plan:", data);
                this.executionPipeline = [];
                this.currentStepIndex = 0;
                return;
            }

            this.executionPipeline = data.navigation_plan.route || [];
            this.currentStepIndex = 0;

            console.log(
                "[AGENT] Execution pipeline received:",
                this.executionPipeline
            );
        } catch (err) {
            console.error("[AGENT] Error planning execution:", err);
            this.executionPipeline = [];
            this.currentStepIndex = 0;
        }
    }

    async executeStep(step) {
        const domSnapshot = this.vdomHandler.getSafeVirtualDomSnapshot();
        const domHtml = this.serializeDOM(domSnapshot);

        console.log("Dom html: ", domHtml);
        
        const resp = await fetch(apis.worker, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: this.sessionId,
                instruction: step,
                dom_snapshot: domHtml,
            }),
        });

        const result = await resp.json();

        console.log("Result of this step: ", result);
        
        this.executionLog.push({ step, result });
        return result;
    }

    serializeDOM(vNode) {
        if (!vNode) return "";
        if (vNode.tagName === "TEXT") return vNode.options.text;
        const attrs = Object.entries(vNode.options.attrs || {})
            .map(([k, v]) => (v === "" ? k : `${k}="${v}"`))
            .join(" ");
        const children = (vNode.options.children || [])
            .map((c) => this.serializeDOM(c))
            .join("");
        return `<${vNode.tagName}${attrs ? " " + attrs : ""}>${children}</${
            vNode.tagName
        }>`;
    }

    async run(query) {
        if (!this.executionPipeline.length) {
            await this.planExecution(query);
        }

        while (this.currentStepIndex < this.executionPipeline.length) {
            const step = this.executionPipeline[this.currentStepIndex];
            console.log(
                `[AGENT] Executing step ${step.step_number} from ${step.from_page} → ${step.to_page}`
            );

            try {
                const result = await this.executeStep(step);
                if (result.error) {
                    console.warn(
                        `[AGENT] Worker failed at step ${step.step_number}:`,
                        result.error
                    );
                    console.log("[AGENT] Asking Foreman to replan...");
                    await this.planExecution(query);
                    continue;
                }
                // Apply result locally (frontend execution)
                this.applyExecution(result.execution);
                this.currentStepIndex++;
            } catch (err) {
                console.error("[AGENT] Error executing step:", err);
                await this.planExecution(query);
            }
        }

        console.log("[AGENT] Execution finished. Log:", this.executionLog);
    }

    applyExecution(execution) {
        console.log("We are trying to apply execution: ", execution);
        
        if (execution.action === "click") {
            const el = document.querySelector(execution.target);
            if (el) el.click();
        } else if (execution.action === "input") {
            const el = document.querySelector(execution.target);
            if (el) el.value = execution.value;
        }
    }
}

export default VoiceNavAgent;
