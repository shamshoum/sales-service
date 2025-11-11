# Homework Assignment


## Introduction

As part of the interview process, you are required to complete a homework assignment based on the **Product Requirements Document (PRD): Order Processing Integration** provided separately. This assignment is designed to assess your ability to design and implement a system in line with product requirements, while demonstrating technical depth, and clarity.

The assignment is divided into two sequential tasks. **You must submit the first part for review and approval before proceeding to the second part.**

---

## Task 1: System Design One-Pager

Your first task is to create a **system design document**. The document should include the following sections:

1. **Components Section**  
   - List each system component (e.g., services, lambdas, databases, queues, etc.) and describe its responsibility. do not forget infrastructure components as well.
   - Make sure to cover both Sales and Delivery system components as described in the PRD.

2. **System Design Diagram**  
   - Provide a **diagram** illustrating the high-level architecture of the solution.
   - The diagram should capture components, interactions, and data flow.

3. **Flow Diagram**  
   - Provide a **separate flow diagram** illustrating the lifecycle of an order and the communication between components.


4. **Non-Functional Requirements Adherence**  
   - Explain how your proposed design addresses each non-functional requirement specified in the PRD.
   - For each non-functional requirement, provide a brief justification or example from your design.


**Technical Guidelines:** You may use Generative AI tools to accomplish the mission.


**Deliverable:** A document not longer than **two pages** (PDF, DOCX, Markdown or equivalent).

---

## Task 2: Implementation of the Sales System

Once your design document is reviewed and approved, you will proceed to implement the **Sales System** as specified in the PRD.

**Technical Guidelines:**
- You should use JavaScript (or TypeScript, preferably) with any framework you are comfortable with.
- Focus on writing clean, maintainable, and testable code.
- You may (not mandatory) mock external dependencies (e.g., Delivery system, availability check) as needed.
- You may use Generative AI tools to accomplish the mission.
- Include brief documentation on how to run your service.
- The implementation should not go deeper than the Dockerfile (if any); there is no need to code the infrastructure part (e.g., Terraform, CloudFormation, etc.).

**Deliverable:** A working implementation of the Sales system, shared as a Git repository or compressed project folder, with documentation.

---

## Submission Instructions

1. Submit **Task 1** (system design document) first. Only upon approval will you proceed to Task 2.
2. Submit **Task 2** (Sales system implementation) along with clear setup instructions and any assumptions made.

---

**Good luck!** We look forward to reviewing your work.

