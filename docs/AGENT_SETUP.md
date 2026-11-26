# Agent workflow

ClientFlow used three roles defined in [AGENTS.md](../AGENTS.md). This is a description of the development process, not a prerequisite for running the app.

| Role         | Responsibility                                               |
| ------------ | ------------------------------------------------------------ |
| Orchestrator | Scope, delegation, candidate freeze, evidence and acceptance |
| Development  | Authorized implementation, regression tests and corrections  |
| Testing      | Independent verification on the frozen candidate             |

Development and Testing work sequentially on each candidate. The Orchestrator records the actual handoffs, verifies candidate identity before review, and sends reproducible findings back to Development before asking Testing to retest. The system does not treat an agent's name, a proposed check, or a mock as evidence that a real check ran.

Runtime settings and raw verification artifacts are kept local. The [public evidence summary](AGENT_EVIDENCE.md) provides actual run references, results and limitations without requiring access to local agent configuration.
