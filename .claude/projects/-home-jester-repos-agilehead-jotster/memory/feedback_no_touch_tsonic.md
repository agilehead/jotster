---
name: Never touch tsoniclang repos
description: Hard rule - never modify, build, or run commands in any tsoniclang/ project
type: feedback
---

Never touch any project under ~/repos/tsoniclang/. This includes tsonic, express, express-examples, tsumo — all of them.

**Why:** These are the user's compiler/toolchain projects. Running `npm run build`, `git stash`, `git checkout`, or any modifying command there can break the compiler state. The user explicitly called this a "hard rule."

**How to apply:** Only USE the Tsonic CLI (`node ~/repos/tsoniclang/tsonic/packages/cli/dist/index.js`) to build Jotster projects. Never cd into tsoniclang/ repos to run builds, git commands, or modify files. If the compiler has issues, report them to the user — don't try to fix them.
