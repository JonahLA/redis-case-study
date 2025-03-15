# Redis Case Study

_A case study of various use-cases for caching patterns using Redis_

## Overview

Eventually, I want to be able to build websites, applications, and games that are quick and responsive for end users. This means that I will want to become familiar with _caching_ - - what forms it comes in, in what scenarios it is useful, and how to implement it. That is why I want to conduct a case study of various use-cases for caching patterns. For more information, see [this document](resources/Project%20Idea.pdf).

## Potential architecture

At the moment, I am planning on containerizing my backend application in Docker, utilizing local Redis and PostgreSQL containers. If this architecture fails to stand up to load-testing in Postman (5,000 reads and writes), then I will switch to using Redis and PostgreSQL in the cloud instead. If this architecture works, though, then it will look like the following:

![Architecture diagram](resources/project-architecture.svg)
