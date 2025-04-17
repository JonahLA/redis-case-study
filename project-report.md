# Final Project - Report

## Table of Contents

1. [Project Overview](#project-overview)
   - [Why?](#why)
   - [Desired Learning Outcomes](#desired-learning-outcomes)
   - [What?](#what)
2. [Project Results](#project-results)
   - [Learning Outcome 1: Caching Patterns](#learning-outcome-1-caching-patterns)
   - [Learning Outcome 2: Redis (DID NOT FINISH)](#learning-outcome-2-redis-did-not-finish)
   - [Learning Outcome 3: Agentic AI](#learning-outcome-3-agentic-ai)
3. [Lessons Learned](#lessons-learned)
   - [Agentic AI](#agentic-ai)
     - [Key Takeaways](#key-takeaways)
     - [Prompt Examples](#prompt-examples)
4. [Future Work](#future-work)

## Project overview

### Why?
If you explore [this website](https://www.mcmaster.com/) for a bit, you may discover that you came to really enjoy clicking around through different pages. You might not have even known anything about gauge blocks or shim stock, but the website just _felt_ good to use. The story would have been different if the website took a few seconds to load each page and if the images didn't display until you waited a second on each page. _Applications that were quick just felt good._ I knew that sometime down the line, I would want to make my own applications. I wanted those applications to give users the same experience I had when using the McMaster-Carr website.

Now, there were plenty of frontend voodoo spells in the McMaster website that allowed it to be so quick and responsive - - I had no interest in those. What I _was_ interested in, though, was how caching could be used to help websites both speed up and allow many concurrent users to interact with it. Thus, for this project, I wanted to explore different caching patterns and how they could be implemented.

_(As a side note, one of my sub-goals with this project was honing my skills with using agentic artificial intelligence for software development. The great sprint to developing the first artificial general intelligence had given way to agentic models that were incredibly capable. Rumors were even floating that AI could replace entry-level programmers in industry. In order to stay competitive, then, I wanted to learn how to yield agentic AI in a way that allowed me to be much more productive than I could've been otherwise.)_

### Desired learning outcomes
My goals with this project were:
1. **To learn about different caching patterns** through researching what they were, when they might be used, and how they were implemented
2. **To deepen my understanding of Redis** through gaining more experience with it
3. **To increase my skills with using agentic AI for software development** through using it for this project

### What?
As a platform for accomplishing these goals, my plan was to create an e-commerce application that sold bowling balls. I would begin by building a baseline server that didn't incorporate any caching. Then, I would run load tests on that server and collected results. With the baseline completed, I would refactor the server to include a caching layer that implemented various caching patterns that I would study. With the refactored server, I would then run the same load tests as before and compare those results to the baseline.

## Project results (up to this point)

### Learning Outcome 1: Caching Patterns

I studied [this Redis solution brief](https://redis.io/wp-content/uploads/2023/04/redis-enterprise-for-caching.pdf) to learn more about different caching patterns. There are some cool ones listed here, but the ones that stuck out to me were:
- _write-behind caching_ - for write-heavy applications -> can write to caching layer (so that the writes and later reads are really fast) and then just asynchronously update your database layer (like with an event-driven system)
- _write-through caching_ - like write-behind caching BUT you need data consistency -> can write to caching layer and then SYNCRHONOUSLY update your database layer (so your system of record and your cache are consistent)
- _cache prefetching_ - for maintaining continuous replication between write-optimized and read-optimized workloads -> i.e., writing to the database (infrequently) and then having a CDC that pulls those changes into your caching layer so you can read from the cache really fast 

### Learning Outcome 2: Redis (DID NOT FINISH)

**Sadly, I have nothing to report about regarding this learning outcome.** Up to this point, I have built out the baseline server and ran some load tests on it. I still need to refactor the server to use the write-behind and cache prefetching patterns before I can run the load tests again.

### Learning Outcome 3: Agentic AI

Overall, I was able to accomplish a LOT more with AI than I would've been able to do by myself. This is evidenced both by the large number of files in this project and by the multiple technologies used which I have never touched before. This wasn't without some growing pains, though. I wasted quite a few hours struggling with the AI, particularly on tasks like writing unit tests and debugging existing code. 

## Lessons Learned

### Agentic AI

#### Key Takeaways

A few key things I learned were:
- Your biggest challenges with using agentic AI are:
  1. _context_ - AI is limited by how many tokens it can take in. Since AI loads into the prompt your conversation up to that point, long conversations can run into token limits. Now, the AI won't tell you that you are hitting these limits, but you may notice your AI start to "forget" things from earlier in the conversation as it drops those tokens to fit your new messages. If this happens, I found it best to have the AI summarize key points from your conversation into a document and then just start a new convo, loading in that document into the AI's context.
  2. _communication_ - I spent HOURS struggling to get the AI to debug and fix its unit tests during this project. It seemed like an endless loop of the AI running the tests, getting errors, making changes, running the tests again, getting more errors, etc. It wasn't until late into the project that I realized that the issue was that I _assumed_ the model was referring to the implementation when writing/debugging the unit tests. IT WAS NOT! This breakdown in communication - - since I didn't tell it specifically to refer to the implementation and just assumed it would instead - - caused a lot of headaches. This can be avoided by writing very clear prompts (like breaking down what you want the AI to do into steps which is a strategy I describe below).
- If you are concerned about having AI write your codebase and thus not understanding any of it, then have the AI write work/dev logs every time it finishes implementing something. 
- ChatGPT is better for creative activities (e.g., coming up with project ideas), Gemini is better for research (e.g., learning about new technologies), and Claude is better for coding.
- You shouldn't use the "Agent" mode for everything. It makes sense to use it when implementing a ticket, for sure. When fixing a file or two, though, the "Write" mode is better and cheaper. When asking for ideas/suggestions/analysis of code, the "Read" mode is even better and more cheaper.
- Prompt quality IS important. There were a few prompting strategies I learned in particular:
  - You should break down into steps what you want the AI to do.
  - You should tell the AI at the end to ask you any clarifying questions it has.
  - You can ask the AI to interview you when you are tring to brainstorm or plan something and you aren't entirely sure what it will look like.

#### Prompt Examples

Here are a few examples of prompts that happened to work well during my project:

**Implementing a story ticket**
```txt
We are ready to begin implementing the story ticket, #file:11_baseline-load-testing.md. I need you to do the following:

Step 1: Review the implementation plan outlined in #file:11_baseline-load-testing.md. Our goal will be to implement this plan, and we will accomplish it step-by-step.

Step 2: Review the contracts for the endpoints that will be used in load testing. The controller methods for the endpoints (whereby you can review their contracts) can be found in #file:cartController.ts, #file:orderController.ts, and #file:productController.ts.

Step 3: Once you've gathered sufficient context, you may begin with the first implementation step outlined in the ticket: "Test Environment Step." When you have done so, report back to me.

If you need clarification on your task, then begin by asking me any questions. Otherwise, you may begin.
```

**Writing a work log so can resume the task later**
```txt
This is good so far. I have to go, though, which means we need to suspend our conversation for now. Will you create a new work log file with the high-level decisions you made implementing the ticket AND the key findings you have made in debugging the load tests so that we can load that information into context when we resume the ticket later? This will look like the following:

Step 1: Analyze work logs found in #folder:work-logs to understand the structure of the work log files.

Step 2: Write a work log for your decisions/findings from the #file:11_baseline-load-testing.md ticket and from this conversation up to this point. (Note that today's date is April ##, 2025).

Step 3: Update the work log index #file:work-log-index.md with a reference to the new work log.

Let me know if you have any questions.
```

**Analyzing existing code and making a plan from it**
```txt
We need to re-seed the database and we happen to have a seeding file that does this; however, I believe this seeding script is out-of-date since we've implemented some new endpoints and fixed some behavior since then. I need you to review the existing seeding script, analyze the current codebase/database schemas, determine what updates need to be made to the seeding script, and then if there are any, implement those updates.

Step 1: Review the seeding script #file:seed.ts so you know how the database is being seeded currently.

Step 2: Review the current state of data in the codebase by reviewing the Prisma schemas in #file:schema.prisma.

Step 3: Analyze your findings from the first two steps to produce a plan for what updates (if any) need to be made to the seeding script to make it complete and useful again.

When you get to this point, report back to me. Before starting, ask me any clarifying questions you have if you have any.
```

## Future Work

### Next Steps Towards Finishing the Project

Next steps for this project include:
- Implementing the write-behind pattern
- Implementing the cache prefetching pattern
- Running the load tests again and gathering results
