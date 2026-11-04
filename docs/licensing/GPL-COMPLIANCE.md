# GPL compliance — MELEH ONE client

Working checklist for distributing the client. It is not legal advice; have counsel confirm it before the first public release.

## What the GPL-3.0 requires from us

| Requirement | How we meet it | Status |
|---|---|---|
| Keep upstream copyright and license notices | `apps/web/LICENSE` and `apps/mobile/LICENSE` are unchanged; [NOTICE](../../NOTICE) credits Uniswap/interface | Done |
| Mark modified files and say what changed | NOTICE summarizes changes; git history on `meleh/main` holds the details | Done |
| Provide the corresponding source for every distributed build | Public repo `MELEH-C-Corp/one-client`, branch `meleh/main` | Done (tag each release) |
| Tell users where to get the source | Link to the repo from Settings → About (web, mobile, extension) and app store descriptions | Not started |
| License the whole derivative under GPL-3.0 | Client stays GPL; the private backend (`platform/`) must never import client code | Ongoing rule |
| App stores | Apple's App Store terms add restrictions the GPL does not allow. Keep the source public and ship an install route outside the store; get counsel's view before the iOS release | Needs legal review |

## Trademarks

The GPL licenses code, not the "Uniswap" name or logos. User-facing branding must be MELEH ONE. "Uniswap" may appear only as a factual reference (protocol name, attribution in NOTICE, links to protocol docs).

## Before each release

1. Push the exact commit used for the build to the public repo and tag it with the release version.
2. Confirm that NOTICE and the LICENSE files ship in the bundle or are linked from it.
3. Re-run the licence scan of dependencies (`packages/*` keep their own licences).
