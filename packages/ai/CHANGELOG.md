# Changelog

## [0.47.0](https://github.com/axiomhq/ai/compare/axiom-v0.46.1...axiom-v0.47.0) (2026-02-25)


### Features

* make packages/ai ESM-only ([#265](https://github.com/axiomhq/ai/issues/265)) ([2c5a9f4](https://github.com/axiomhq/ai/commit/2c5a9f4159d98cfa9c65f664289f152ea1803b1a))

## [0.46.1](https://github.com/axiomhq/ai/compare/axiom-v0.46.0...axiom-v0.46.1) (2026-02-25)


### Bug Fixes

* **ai:** move online eval scorer counters to eval.* namespace ([#264](https://github.com/axiomhq/ai/issues/264)) ([bef94db](https://github.com/axiomhq/ai/commit/bef94db48b59e923e57b2fca7238cc2a89c66bfd))
* **ai:** normalize boolean scores in onlineEval scoresSummary ([#263](https://github.com/axiomhq/ai/issues/263)) ([ff75842](https://github.com/axiomhq/ai/commit/ff758426d58cd3d1ca3b0824b55b9656d9b71d17))

## [0.46.0](https://github.com/axiomhq/ai/compare/axiom-v0.45.0...axiom-v0.46.0) (2026-02-19)


### Features

* **ai:** add mandatory name parameter to onlineEval ([#259](https://github.com/axiomhq/ai/issues/259)) ([3e0e44a](https://github.com/axiomhq/ai/commit/3e0e44a884216ad98ca9ff9f6225c55b67f39241))

## [0.45.0](https://github.com/axiomhq/ai/compare/axiom-v0.44.0...axiom-v0.45.0) (2026-02-17)


### Features

* **ai:** add eval.case.scores summary attribute to online evals ([#256](https://github.com/axiomhq/ai/issues/256)) ([ca9e6f7](https://github.com/axiomhq/ai/commit/ca9e6f742d51f8f2e959d07a1bc024a2c628ddd9))


### Bug Fixes

* **ai:** add 'offline' tag to offline eval spans ([#258](https://github.com/axiomhq/ai/issues/258)) ([07b2f16](https://github.com/axiomhq/ai/commit/07b2f16b1fe0ab6b0cf5355f5b3ddd6beb1afb98))
* **ai:** normalize boolean scores for precomputed online eval scorers ([#253](https://github.com/axiomhq/ai/issues/253)) ([4fafb59](https://github.com/axiomhq/ai/commit/4fafb59a13008221ed403aeeb839f5f08df7b0f9))
* rename OnlineEval link attribute to links ([#254](https://github.com/axiomhq/ai/issues/254)) ([4a2d7e4](https://github.com/axiomhq/ai/commit/4a2d7e4f75679fbc02796082df947b86002358fb))

## [0.44.0](https://github.com/axiomhq/ai/compare/axiom-v0.43.0...axiom-v0.44.0) (2026-02-16)


### Features

* per-case error handling in SDK ([#236](https://github.com/axiomhq/ai/issues/236)) ([d828ab4](https://github.com/axiomhq/ai/commit/d828ab4fb1d9b553c3143b2817e669ccd0a16e90))


### Bug Fixes

* **ai:** CLI dataset override and improved error handling ([#246](https://github.com/axiomhq/ai/issues/246)) ([261d0fa](https://github.com/axiomhq/ai/commit/261d0fa331f875d52d53f404a1cce4023a30dc65))
* **ai:** use global tracer and fix attribute parity in online evals ([#249](https://github.com/axiomhq/ai/issues/249)) ([3b2ee4e](https://github.com/axiomhq/ai/commit/3b2ee4ede3e2a4e67b756770c20814257fd0dddc))

## [0.43.0](https://github.com/axiomhq/ai/compare/axiom-v0.42.0...axiom-v0.43.0) (2026-02-12)


### Features

* **ai:** deprecate old Scorer/onlineEval imports, add evals/online entry point ([#237](https://github.com/axiomhq/ai/issues/237)) ([d5a8068](https://github.com/axiomhq/ai/commit/d5a8068cd6445b50c83bba8eff681b4283067632))
* allow onlineEval to accept precomputed scorer results, better sampling ([#241](https://github.com/axiomhq/ai/issues/241)) ([c7b1f0a](https://github.com/axiomhq/ai/commit/c7b1f0a768297d4b63601bece56d80b88ce2483a))
* use `/ai` instead of `/ai-engineering` for result links ([#235](https://github.com/axiomhq/ai/issues/235)) ([87440fd](https://github.com/axiomhq/ai/commit/87440fdebec5b87da06999f193800fc943256a91))

## [0.42.0](https://github.com/axiomhq/ai/compare/axiom-v0.41.0...axiom-v0.42.0) (2026-02-06)


### Features

* **ai:** add vitest-free axiom/ai/evals/scorers entry point ([#233](https://github.com/axiomhq/ai/issues/233)) ([c623d62](https://github.com/axiomhq/ai/commit/c623d62ca0d1b49a754a14379dd2d0c933fff96a))

## [0.41.0](https://github.com/axiomhq/ai/compare/axiom-v0.40.0...axiom-v0.41.0) (2026-02-06)


### Features

* **ai:** add online evaluations for production monitoring ([#223](https://github.com/axiomhq/ai/issues/223)) ([748122e](https://github.com/axiomhq/ai/commit/748122e1d6e8d5872856a2963abad68d0b4bf8d4))

## [0.40.0](https://github.com/axiomhq/ai/compare/axiom-v0.39.0...axiom-v0.40.0) (2026-02-06)


### Features

* add conversationId to withSpan ([#228](https://github.com/axiomhq/ai/issues/228)) ([a6c07af](https://github.com/axiomhq/ai/commit/a6c07af733e191cf45cf922eb1576606daba45cf))
* **ai:** allow boolean score in Score objects with custom metadata ([#231](https://github.com/axiomhq/ai/issues/231)) ([de2020a](https://github.com/axiomhq/ai/commit/de2020a2596f4963c892adafa49b638331516203))

## [0.39.0](https://github.com/axiomhq/ai/compare/axiom-v0.38.1...axiom-v0.39.0) (2026-02-05)


### Features

* **edge:** added support for edge regions ([#224](https://github.com/axiomhq/ai/issues/224)) ([8f7b99c](https://github.com/axiomhq/ai/commit/8f7b99ce7ec884aa7251b3edd6b3d28f62418058))

## [0.38.1](https://github.com/axiomhq/ai/compare/axiom-v0.38.0...axiom-v0.38.1) (2026-02-02)


### Bug Fixes

* eval output gets json.stringified even if it's a string already ([#221](https://github.com/axiomhq/ai/issues/221)) ([107e1ad](https://github.com/axiomhq/ai/commit/107e1ad02c4e3f4003c5224abaf570ef16dd0a18))

## [0.38.0](https://github.com/axiomhq/ai/compare/axiom-v0.37.0...axiom-v0.38.0) (2026-01-15)


### Features

* **feedback:** return noop client when config is missing ([#207](https://github.com/axiomhq/ai/issues/207)) ([abb4f2c](https://github.com/axiomhq/ai/commit/abb4f2cb38f33a8a126dc2457fc962af43801b99))
* remove `category` from feedback in sdk ([#209](https://github.com/axiomhq/ai/issues/209)) ([0a72aad](https://github.com/axiomhq/ai/commit/0a72aadd1778bbfeb2725e43a356c44632f04f93))
* support ai sdk v6 / LanguageModelV3 ([#208](https://github.com/axiomhq/ai/issues/208)) ([0f2f4f8](https://github.com/axiomhq/ai/commit/0f2f4f8cef0b7993477e04131a080c46d1894568))

## [0.37.0](https://github.com/axiomhq/ai/compare/axiom-v0.36.0...axiom-v0.37.0) (2026-01-08)


### Features

* more improvements to feedback types ([#205](https://github.com/axiomhq/ai/issues/205)) ([9af3fc4](https://github.com/axiomhq/ai/commit/9af3fc46f2489e23d8919c3fe4a8c3882bbdc47c))

## [0.36.0](https://github.com/axiomhq/ai/compare/axiom-v0.35.0...axiom-v0.36.0) (2026-01-08)


### Features

* better feedback types, naming, and jsdoc ([#203](https://github.com/axiomhq/ai/issues/203)) ([5836944](https://github.com/axiomhq/ai/commit/583694420f88f11c506e60c0b6d4b0e964a098dd))
* **feedback:** pass context to onError callback ([#202](https://github.com/axiomhq/ai/issues/202)) ([d1d7eff](https://github.com/axiomhq/ai/commit/d1d7eff02ec4cfa477b2bffbb1d122325dca82bb))

## [0.35.0](https://github.com/axiomhq/ai/compare/axiom-v0.34.2...axiom-v0.35.0) (2025-12-19)


### Features

* feedback ([#190](https://github.com/axiomhq/ai/issues/190)) ([13056da](https://github.com/axiomhq/ai/commit/13056dac032d38480598d2948b1a878767edf45f))

## [0.34.2](https://github.com/axiomhq/ai/compare/axiom-v0.34.1...axiom-v0.34.2) (2025-12-16)


### Bug Fixes

* `npx axiom login` fails due to vitest ([#195](https://github.com/axiomhq/ai/issues/195)) ([81973cf](https://github.com/axiomhq/ai/commit/81973cfaa08ba526f774bbc73d03c495c0083221))

## [0.34.1](https://github.com/axiomhq/ai/compare/axiom-v0.34.0...axiom-v0.34.1) (2025-12-11)


### Bug Fixes

* skip token/dataset validation in debug mode ([#176](https://github.com/axiomhq/ai/issues/176)) ([453d3b6](https://github.com/axiomhq/ai/commit/453d3b68e548229c3dabb0e647cd058f9df84095))

## [0.34.0](https://github.com/axiomhq/ai/compare/axiom-v0.33.0...axiom-v0.34.0) (2025-12-10)


### Features

* simplify `Eval` types, better validation error ([#185](https://github.com/axiomhq/ai/issues/185)) ([bc57d16](https://github.com/axiomhq/ai/commit/bc57d166017490bb54ec77f41bec2a192211b89f))


### Bug Fixes

* passing partial objects for flags crashes cli ([#179](https://github.com/axiomhq/ai/issues/179)) ([fe9af39](https://github.com/axiomhq/ai/commit/fe9af39af1dbfc4a03479e38eb6e0541c2e2818a))

## [0.33.0](https://github.com/axiomhq/ai/compare/axiom-v0.32.0...axiom-v0.33.0) (2025-12-10)


### Features

* cast tokens to number ([#186](https://github.com/axiomhq/ai/issues/186)) ([b718360](https://github.com/axiomhq/ai/commit/b7183605cd5da0ef1cf462c807097d573d157ac3))
* put `eval.case.metadata` on case span ([#184](https://github.com/axiomhq/ai/issues/184)) ([33ad844](https://github.com/axiomhq/ai/commit/33ad8446dae985549d854f4d3bb7bb812b1b58b4))
* show all flag validation failures ([#178](https://github.com/axiomhq/ai/issues/178)) ([51dce37](https://github.com/axiomhq/ai/commit/51dce375126360ff5dc9f415b188bd2e2e7efd38))

## [0.32.0](https://github.com/axiomhq/ai/compare/axiom-v0.31.1...axiom-v0.32.0) (2025-12-01)


### Features

* allow `data` to be just an array ([#171](https://github.com/axiomhq/ai/issues/171)) ([05cfa10](https://github.com/axiomhq/ai/commit/05cfa1091113b80d12c19241708cca670f5b92a1))
* allow scorer functions to return boolean ([#170](https://github.com/axiomhq/ai/issues/170)) ([6c7ad7e](https://github.com/axiomhq/ai/commit/6c7ad7e1d17061947f4545ee84e49ba76521ffad))
* if there is one eval in the run, navigate to the eval instance directly ([#177](https://github.com/axiomhq/ai/issues/177)) ([e95e326](https://github.com/axiomhq/ai/commit/e95e326a35d6abc0bad26616552bd678c82173f9))
* improve data/scorer types, again ([#173](https://github.com/axiomhq/ai/issues/173)) ([eeaeb6b](https://github.com/axiomhq/ai/commit/eeaeb6b52cb675896a6cfbdedc82ad1e5d98ca8a))
* show config diff relative to defaults, not just baseline ([#174](https://github.com/axiomhq/ai/issues/174)) ([5ff3390](https://github.com/axiomhq/ai/commit/5ff3390c797c2b1b562cba9e541ec8cd5ec1629f))
* validate flag schema when running evals ([#175](https://github.com/axiomhq/ai/issues/175)) ([1c48507](https://github.com/axiomhq/ai/commit/1c48507ffc4a271ed6cd3b326615714dde0d8081))

## [0.31.1](https://github.com/axiomhq/ai/compare/axiom-v0.31.0...axiom-v0.31.1) (2025-11-26)


### Bug Fixes

* evals break in projects with import aliases ([#167](https://github.com/axiomhq/ai/issues/167)) ([2bcc36a](https://github.com/axiomhq/ai/commit/2bcc36a1e42e6a21054284fac8fa8b920e3947a0))

## [0.31.0](https://github.com/axiomhq/ai/compare/axiom-v0.30.0...axiom-v0.31.0) (2025-11-26)


### Features

* update runner, improve instrumentation hooks dx ([#165](https://github.com/axiomhq/ai/issues/165)) ([1f29ca5](https://github.com/axiomhq/ai/commit/1f29ca5e26e58ebe07e9110468d13e43a55bc6b9))

## [0.30.0](https://github.com/axiomhq/ai/compare/axiom-v0.29.1...axiom-v0.30.0) (2025-11-25)


### Features

* better error serialization. pick one ([#145](https://github.com/axiomhq/ai/issues/145)) ([8ffd863](https://github.com/axiomhq/ai/commit/8ffd8636b4dc229fecb42bf75e39c84f1aba0846))
* **cli:** add shorthands for auth status and switch ([#150](https://github.com/axiomhq/ai/issues/150)) ([c4cfbdd](https://github.com/axiomhq/ai/commit/c4cfbdd3a8f5a4ee63f467f99b9451845105f866))
* move createAppScope out of evals package ([#156](https://github.com/axiomhq/ai/issues/156)) ([d6a6f23](https://github.com/axiomhq/ai/commit/d6a6f23c0fdf8d8cc21ada131c8ebd789b6fefd3))


### Bug Fixes

* baselines not showing, case mismatch producing bad output ([#151](https://github.com/axiomhq/ai/issues/151)) ([a6f2a41](https://github.com/axiomhq/ai/commit/a6f2a4100e6dde730363e6a16749fa24670e9c11))
* config shows "not set" for config that _is_ set ([#152](https://github.com/axiomhq/ai/issues/152)) ([be7ecb0](https://github.com/axiomhq/ai/commit/be7ecb0ac835d7537aa7de680365387608ecf3eb))
* overrides not visible in ui ([#153](https://github.com/axiomhq/ai/issues/153)) ([a9760a6](https://github.com/axiomhq/ai/commit/a9760a6d60f018d15e5fc446e3c5d07989142b89))

## [0.29.1](https://github.com/axiomhq/ai/compare/axiom-v0.29.0...axiom-v0.29.1) (2025-11-20)


### Bug Fixes

* debug mode ([#147](https://github.com/axiomhq/ai/issues/147)) ([a0de30f](https://github.com/axiomhq/ai/commit/a0de30f0a7fea5c7c8dede321ca464eff97994e9))

## [0.29.0](https://github.com/axiomhq/ai/compare/axiom-v0.28.0...axiom-v0.29.0) (2025-11-20)


### Features

* **eval.command:** add console URL override option and integrate with resolver ([#124](https://github.com/axiomhq/ai/issues/124)) ([f4d2302](https://github.com/axiomhq/ai/commit/f4d2302f356831a5ffc210f7112455a683257b94))


### Bug Fixes

* capture scorer errors and update span status ([#143](https://github.com/axiomhq/ai/issues/143)) ([5b56764](https://github.com/axiomhq/ai/commit/5b56764d65c61cf392771b92ebed7d4665e9071e))
* prevent token usage attributes from being lost in streaming operations ([#141](https://github.com/axiomhq/ai/issues/141)) ([5e31371](https://github.com/axiomhq/ai/commit/5e31371e017468efd2a31ae8edd5d65c02cfb3a0))

## [0.28.0](https://github.com/axiomhq/ai/compare/axiom-v0.27.0...axiom-v0.28.0) (2025-11-18)


### Features

* **ai-76:** validate capability and step names ([#133](https://github.com/axiomhq/ai/issues/133)) ([d5904d9](https://github.com/axiomhq/ai/commit/d5904d9cbc4188499cfa4c988ecb99e7a5fb70f9))
* better ValidateName, which lets us simplify eval types overall ([#137](https://github.com/axiomhq/ai/issues/137)) ([92893d7](https://github.com/axiomhq/ai/commit/92893d7a1375b1de78f30709cf57006a985a13e6))


### Bug Fixes

* **baseline-loading:** Load baseline once after Eval is registered ([#139](https://github.com/axiomhq/ai/issues/139)) ([c12eaf3](https://github.com/axiomhq/ai/commit/c12eaf313b46dc40112a6a9774612dd5bf0dd20b))

## [0.27.0](https://github.com/axiomhq/ai/compare/axiom-v0.26.0...axiom-v0.27.0) (2025-11-17)


### Features

* Add cli auth ([#117](https://github.com/axiomhq/ai/issues/117)) ([9079098](https://github.com/axiomhq/ai/commit/90790986f152f6b53fc990836570e6cafa19f599))
* **AI-76:** add capability and step names ([#135](https://github.com/axiomhq/ai/issues/135)) ([0ec9282](https://github.com/axiomhq/ai/commit/0ec92828b9670c4c5ef7a99918d1894445ac6b28))


### Bug Fixes

* **AI-72:** attach missing baseline version to root span ([#134](https://github.com/axiomhq/ai/issues/134)) ([f1c8ad5](https://github.com/axiomhq/ai/commit/f1c8ad58e2c1acbf161d42c4b2577048d6c87d48))
* **API:** revert v3 naming ([#125](https://github.com/axiomhq/ai/issues/125)) ([2b46d47](https://github.com/axiomhq/ai/commit/2b46d471bbbfefb03178f5fe05bffe5b13e68511))

## [0.26.0](https://github.com/axiomhq/ai/compare/axiom-v0.25.0...axiom-v0.26.0) (2025-11-12)


### Features

* **AI-65:** move Eval() to GA ([#121](https://github.com/axiomhq/ai/issues/121)) ([3c6fb63](https://github.com/axiomhq/ai/commit/3c6fb634b62570eccf34b3624c8fe044d0f33a43))
* type and runtime error if eval or scorer name doesnt match desired pattern ([#118](https://github.com/axiomhq/ai/issues/118)) ([8940c70](https://github.com/axiomhq/ai/commit/8940c7041813d4f505bf6526b3832f69b63c9ba3))

## [0.25.0](https://github.com/axiomhq/ai/compare/axiom-v0.24.0...axiom-v0.25.0) (2025-11-11)


### Features

* add `--list` flag ([#116](https://github.com/axiomhq/ai/issues/116)) ([4f303cf](https://github.com/axiomhq/ai/commit/4f303cf6029e67ff766b3f47da732dc10de25244))

## [0.24.0](https://github.com/axiomhq/ai/compare/axiom-v0.23.0...axiom-v0.24.0) (2025-11-06)


### Features

* **evals:** add runId to evaluation payload and reporting ([#105](https://github.com/axiomhq/ai/issues/105)) ([18518b2](https://github.com/axiomhq/ai/commit/18518b27dd499694f9207844f59f91b41cfbfa4d))


### Bug Fixes

* CLI doesn't show any warnings if it fails to register evaluation ([#111](https://github.com/axiomhq/ai/issues/111)) ([68a712d](https://github.com/axiomhq/ai/commit/68a712dbe5e83a70e2e2c00a8f19419776bb45fa))

## [0.23.0](https://github.com/axiomhq/ai/compare/axiom-v0.22.2...axiom-v0.23.0) (2025-11-04)


### Features

* better scorers ([#106](https://github.com/axiomhq/ai/issues/106)) ([cb95b46](https://github.com/axiomhq/ai/commit/cb95b4609dcbd6c706897664e885661b392fe66d))
* default name for chat span should be `chat`, not `gen_ai.call_llm` ([#108](https://github.com/axiomhq/ai/issues/108)) ([ad560d0](https://github.com/axiomhq/ai/commit/ad560d07442e587d41f162d19f058b2cdca88b7b))
* **evaluations:** add evaluation API reporting ([#91](https://github.com/axiomhq/ai/issues/91)) ([e50e125](https://github.com/axiomhq/ai/commit/e50e1254f6f4cdba3e0c9c0e0837358ed7ec7961))


### Bug Fixes

* incorrect default shown for flag overrides ([#107](https://github.com/axiomhq/ai/issues/107)) ([ebd539d](https://github.com/axiomhq/ai/commit/ebd539d16527d376be234e2c24d220a54a152347))
* missing task spans when eval errors ([#110](https://github.com/axiomhq/ai/issues/110)) ([6787829](https://github.com/axiomhq/ai/commit/6787829d079d6a26851dd88ebb5b8af472b816a1))

## [0.22.2](https://github.com/axiomhq/ai/compare/axiom-v0.22.1...axiom-v0.22.2) (2025-10-22)


### Bug Fixes

* users application spans are using cli instrumentation ([#103](https://github.com/axiomhq/ai/issues/103)) ([d9ed0de](https://github.com/axiomhq/ai/commit/d9ed0deb5b400726bfcfc57bb7a0175ec9dea548))

## [0.22.1](https://github.com/axiomhq/ai/compare/axiom-v0.22.0...axiom-v0.22.1) (2025-10-13)


### Bug Fixes

* **cli:** externalize c12 to resolve "Dynamic require of 'os'" error in eval command ([#100](https://github.com/axiomhq/ai/issues/100)) ([07100a2](https://github.com/axiomhq/ai/commit/07100a29e1485ece5dcbb2306141f866ceaabf30))

## [0.22.0](https://github.com/axiomhq/ai/compare/axiom-v0.21.0...axiom-v0.22.0) (2025-10-10)


### Features

* `axiom.config.ts` ([#98](https://github.com/axiomhq/ai/issues/98)) ([f70239b](https://github.com/axiomhq/ai/commit/f70239bcb875048e15504a673550b88c707d6cdb))

## [0.21.0](https://github.com/axiomhq/ai/compare/axiom-v0.20.0...axiom-v0.21.0) (2025-10-06)


### Features

* better eval reporting ([#93](https://github.com/axiomhq/ai/issues/93)) ([190fd6b](https://github.com/axiomhq/ai/commit/190fd6b6fb3f2c129c593a1600953db659bc01e2))
* debug mode ([#90](https://github.com/axiomhq/ai/issues/90)) ([1ce1df8](https://github.com/axiomhq/ai/commit/1ce1df82cb8c4f51b82441119d210725a74f77d4))
* make full schema defaults required, simplify `flag` ([#96](https://github.com/axiomhq/ai/issues/96)) ([96830f3](https://github.com/axiomhq/ai/commit/96830f300bc63d90b35b4028c5e1533f501bcbaa))
* update otel setup ([#94](https://github.com/axiomhq/ai/issues/94)) ([5b4ae1f](https://github.com/axiomhq/ai/commit/5b4ae1ff0bbc0aaa2d495df736c3a471861e943b))


### Bug Fixes

* `chat <model> stream` span has `gen_ai.operation.name`, which it should not ([#97](https://github.com/axiomhq/ai/issues/97)) ([b768ffc](https://github.com/axiomhq/ai/commit/b768ffc57d992e998caac7de040ea4749350ae7c))

## [0.20.0](https://github.com/axiomhq/ai/compare/axiom-v0.19.0...axiom-v0.20.0) (2025-09-25)


### Features

* `gen_ai.provider.name` for ai gateway ([#89](https://github.com/axiomhq/ai/issues/89)) ([5f9d804](https://github.com/axiomhq/ai/commit/5f9d8043f92e4f758f0890f7ec85dbcf03d0ab4d))


### Bug Fixes

* environment variables don't load in findEvaluationCases ([#87](https://github.com/axiomhq/ai/issues/87)) ([59f7e95](https://github.com/axiomhq/ai/commit/59f7e95952ebc8cfae0e354223371a964093f256))

## [0.19.0](https://github.com/axiomhq/ai/compare/axiom-v0.18.0...axiom-v0.19.0) (2025-09-23)


### Features

* eval flags ([#78](https://github.com/axiomhq/ai/issues/78)) ([a6a315e](https://github.com/axiomhq/ai/commit/a6a315e0be902d88bc30e6618b162fc48190cf7f))


### Bug Fixes

* don't print report for skipped test suites ([#85](https://github.com/axiomhq/ai/issues/85)) ([dfb11f9](https://github.com/axiomhq/ai/commit/dfb11f9ab1ba1f8e0556a7a5814aa51ebf93087a))
* **format:** fix format errors ([#81](https://github.com/axiomhq/ai/issues/81)) ([602aee5](https://github.com/axiomhq/ai/commit/602aee53175c2db7d11f7f5b8bbdd01ccf74333a))

## [0.18.0](https://github.com/axiomhq/ai/compare/axiom-v0.17.0...axiom-v0.18.0) (2025-09-12)


### Features

* use semantic-conventions 1.37 package ([#74](https://github.com/axiomhq/ai/issues/74)) ([7de66b0](https://github.com/axiomhq/ai/commit/7de66b03a2a162e6ecc86ed476453f6eca0f722d))

## [0.17.0](https://github.com/axiomhq/ai/compare/axiom-v0.16.0...axiom-v0.17.0) (2025-09-04)


### Features

* put capability and step name on tool calls ([#71](https://github.com/axiomhq/ai/issues/71)) ([8b9a06e](https://github.com/axiomhq/ai/commit/8b9a06e8f5fa791d0616da3c0b95e522d3feebf3))

## [0.16.0](https://github.com/axiomhq/ai/compare/axiom-v0.15.0...axiom-v0.16.0) (2025-09-03)


### Features

* match more providers ([#66](https://github.com/axiomhq/ai/issues/66)) ([4ea1498](https://github.com/axiomhq/ai/commit/4ea14989f80c8ec9b963e34c8be694d643228bfc))


### Bug Fixes

* **evals:** fix path resolution ([#68](https://github.com/axiomhq/ai/issues/68)) ([f7eedfe](https://github.com/axiomhq/ai/commit/f7eedfe226432275436d2f3d89ee2752fb6cc5ef))

## [0.15.0](https://github.com/axiomhq/ai/compare/axiom-v0.14.0...axiom-v0.15.0) (2025-08-29)


### Features

* use semconv 1.37, add redaction options ([#63](https://github.com/axiomhq/ai/issues/63)) ([baec814](https://github.com/axiomhq/ai/commit/baec814311d2a3e97ad1edb4c8ba3b661208720e))

## [0.14.0](https://github.com/axiomhq/ai/compare/axiom-v0.13.0...axiom-v0.14.0) (2025-08-28)


### Features

* **evals:** pass model name & params to eval task ([#62](https://github.com/axiomhq/ai/issues/62)) ([bc6f9bf](https://github.com/axiomhq/ai/commit/bc6f9bfb93c8311414e60ddd3dd822e726798257))

## [0.13.0](https://github.com/axiomhq/ai/compare/axiom-v0.12.0...axiom-v0.13.0) (2025-08-20)


### Features

* **evals:** user custom names for cases ([#60](https://github.com/axiomhq/ai/issues/60)) ([e868ad6](https://github.com/axiomhq/ai/commit/e868ad6156f36ebca1e9ffd1aa69f58e47772ec8))

## [0.12.0](https://github.com/axiomhq/ai/compare/axiom-v0.11.2...axiom-v0.12.0) (2025-08-17)


### Features

* better stream handling ([#57](https://github.com/axiomhq/ai/issues/57)) ([68c5a4d](https://github.com/axiomhq/ai/commit/68c5a4df3cbc1c30ad858817e8592d8a275c4014))

## [0.11.2](https://github.com/axiomhq/ai/compare/axiom-v0.11.1...axiom-v0.11.2) (2025-08-15)


### Features

* **evals:** send score errors and tighten the scorer type ([#55](https://github.com/axiomhq/ai/issues/55)) ([85044f5](https://github.com/axiomhq/ai/commit/85044f529eefe4a767cbb82780dcc3ed869e4723))

## [0.11.1](https://github.com/axiomhq/ai/compare/axiom-v0.11.0...axiom-v0.11.1) (2025-08-15)


### Features

* **evals:** attach user info to eval span ([#53](https://github.com/axiomhq/ai/issues/53)) ([449674e](https://github.com/axiomhq/ai/commit/449674e3a89ca8f0672b0cdbf0e40ab1f1cd1c2a))

## [0.11.0](https://github.com/axiomhq/ai/compare/axiom-v0.10.0...axiom-v0.11.0) (2025-08-14)


### ⚠ BREAKING CHANGES

* change cli run command to eval [#49]
* print summary table after eval runs [#49]

## [0.10.0](https://github.com/axiomhq/ai/compare/axiom-v0.8.0...axiom-v0.10.0) (2025-08-11)


### ⚠ BREAKING CHANGES

* update package name ([#43](https://github.com/axiomhq/ai/issues/43))

### Features

* add cjs output ([#25](https://github.com/axiomhq/ai/issues/25)) ([7780d1a](https://github.com/axiomhq/ai/commit/7780d1a9631054969522a20a16f8f327d2954ebc))
* add prompts and evals as experimental_ features to ai package ([#32](https://github.com/axiomhq/ai/issues/32)) ([e385507](https://github.com/axiomhq/ai/commit/e385507e98472ac62ad98c7545164184ab592868))
* create withSpan and ai wrapper ([fd261d9](https://github.com/axiomhq/ai/commit/fd261d97571e281b59dcab6d52b19162d0c757cd))
* **evals:** register evals at Axiom ([#41](https://github.com/axiomhq/ai/issues/41)) ([5e7c8a4](https://github.com/axiomhq/ai/commit/5e7c8a4f3f94a897cd2ee7d3e7f91b80c3cb5855))
* instrument tool calls, simplify schema, increase test coverage, add examples, a lot of refactoring ([#10](https://github.com/axiomhq/ai/issues/10)) ([db0b533](https://github.com/axiomhq/ai/commit/db0b533b989c2c9b84b78f4b3df00474aaae0473))
* move to middleware ([#31](https://github.com/axiomhq/ai/issues/31)) ([c30c764](https://github.com/axiomhq/ai/commit/c30c764661e347f90fb70ad6a3babd14fbe70040))
* publint ([#27](https://github.com/axiomhq/ai/issues/27)) ([6da8067](https://github.com/axiomhq/ai/commit/6da8067a2e442c5fdca7d10f734a0a0d14765912))
* setup global TracerProvider to make `initAxiomAI` pass the corr… ([#37](https://github.com/axiomhq/ai/issues/37)) ([cecb816](https://github.com/axiomhq/ai/commit/cecb8163dbf390f65030f0181109aef46e7377f1))
* support LanguageModelV2 / ai sdk v5 ([#8](https://github.com/axiomhq/ai/issues/8)) ([1dae459](https://github.com/axiomhq/ai/commit/1dae4591cdc08763bebe01fd8b55ce8bfeb99b3f))
* support vercel ai sdk v5 final ([#35](https://github.com/axiomhq/ai/issues/35)) ([45316ec](https://github.com/axiomhq/ai/commit/45316ec0f88228f5ececdba4a9c99922e65296e1))
* update package name ([#43](https://github.com/axiomhq/ai/issues/43)) ([6917ba7](https://github.com/axiomhq/ai/commit/6917ba7eb5c7c5187149360b3f1dfad923bde322))
* update span shape / semantic conventions ([#7](https://github.com/axiomhq/ai/issues/7)) ([376e5d5](https://github.com/axiomhq/ai/commit/376e5d50b6be48a44d9052b8e99e5e6547d52501))
* warn if no tracer found, add jsdoc ([#29](https://github.com/axiomhq/ai/issues/29)) ([cc9f1dc](https://github.com/axiomhq/ai/commit/cc9f1dcd1ea1298de70c332f4908c4e1dbe5686a))


### Bug Fixes

* revert 1.0.0 and release as 0.10.0 ([c1b9c4f](https://github.com/axiomhq/ai/commit/c1b9c4fadadf06349659476afd62284eb79a9a0f))
* streamText fails to send `chat` span silently with AI SDK v4 ([#20](https://github.com/axiomhq/ai/issues/20)) ([9232860](https://github.com/axiomhq/ai/commit/9232860664580a87e1e55f9b372dca31f18a8f0e))
* **test:** coverage and missing deps ([#4](https://github.com/axiomhq/ai/issues/4)) ([0b8952f](https://github.com/axiomhq/ai/commit/0b8952f095712f2b88abfd7556bff566c6716dd9))

## [0.8.0](https://github.com/axiomhq/ai/compare/ai-v0.7.0...ai-v0.8.0) (2025-08-04)


### Features

* add prompts and evals as experimental_ features to ai package ([#32](https://github.com/axiomhq/ai/issues/32)) ([e385507](https://github.com/axiomhq/ai/commit/e385507e98472ac62ad98c7545164184ab592868))

## [0.7.0](https://github.com/axiomhq/ai/compare/ai-v0.6.0...ai-v0.7.0) (2025-08-04)


### Features

* setup global TracerProvider to make `initAxiomAI` pass the corr… ([#37](https://github.com/axiomhq/ai/issues/37)) ([cecb816](https://github.com/axiomhq/ai/commit/cecb8163dbf390f65030f0181109aef46e7377f1))

## [0.6.0](https://github.com/axiomhq/ai/compare/ai-v0.5.0...ai-v0.6.0) (2025-08-01)


### Features

* support vercel ai sdk v5 final ([#35](https://github.com/axiomhq/ai/issues/35)) ([45316ec](https://github.com/axiomhq/ai/commit/45316ec0f88228f5ececdba4a9c99922e65296e1))

## [0.5.0](https://github.com/axiomhq/ai/compare/ai-v0.4.0...ai-v0.5.0) (2025-07-30)


### Features

* move to middleware ([#31](https://github.com/axiomhq/ai/issues/31)) ([c30c764](https://github.com/axiomhq/ai/commit/c30c764661e347f90fb70ad6a3babd14fbe70040))

## [0.4.0](https://github.com/axiomhq/ai/compare/ai-v0.3.0...ai-v0.4.0) (2025-07-25)


### Features

* warn if no tracer found, add jsdoc ([#29](https://github.com/axiomhq/ai/issues/29)) ([cc9f1dc](https://github.com/axiomhq/ai/commit/cc9f1dcd1ea1298de70c332f4908c4e1dbe5686a))

## [0.3.0](https://github.com/axiomhq/ai/compare/ai-v0.2.0...ai-v0.3.0) (2025-07-23)


### Features

* publint ([#27](https://github.com/axiomhq/ai/issues/27)) ([6da8067](https://github.com/axiomhq/ai/commit/6da8067a2e442c5fdca7d10f734a0a0d14765912))

## [0.2.0](https://github.com/axiomhq/ai/compare/ai-v0.1.0...ai-v0.2.0) (2025-07-23)


### Features

* add cjs output ([#25](https://github.com/axiomhq/ai/issues/25)) ([7780d1a](https://github.com/axiomhq/ai/commit/7780d1a9631054969522a20a16f8f327d2954ebc))

## [0.1.0](https://github.com/axiomhq/ai/compare/ai-v0.0.2...ai-v0.1.0) (2025-07-22)


### Features

* create withSpan and ai wrapper ([fd261d9](https://github.com/axiomhq/ai/commit/fd261d97571e281b59dcab6d52b19162d0c757cd))
* instrument tool calls, simplify schema, increase test coverage, add examples, a lot of refactoring ([#10](https://github.com/axiomhq/ai/issues/10)) ([db0b533](https://github.com/axiomhq/ai/commit/db0b533b989c2c9b84b78f4b3df00474aaae0473))
* support LanguageModelV2 / ai sdk v5 ([#8](https://github.com/axiomhq/ai/issues/8)) ([1dae459](https://github.com/axiomhq/ai/commit/1dae4591cdc08763bebe01fd8b55ce8bfeb99b3f))
* update span shape / semantic conventions ([#7](https://github.com/axiomhq/ai/issues/7)) ([376e5d5](https://github.com/axiomhq/ai/commit/376e5d50b6be48a44d9052b8e99e5e6547d52501))


### Bug Fixes

* streamText fails to send `chat` span silently with AI SDK v4 ([#20](https://github.com/axiomhq/ai/issues/20)) ([9232860](https://github.com/axiomhq/ai/commit/9232860664580a87e1e55f9b372dca31f18a8f0e))
* **test:** coverage and missing deps ([#4](https://github.com/axiomhq/ai/issues/4)) ([0b8952f](https://github.com/axiomhq/ai/commit/0b8952f095712f2b88abfd7556bff566c6716dd9))

## 0.0.1 (2025-07-17)


### Features

* create withSpan and ai wrapper ([fd261d9](https://github.com/axiomhq/ai/commit/fd261d97571e281b59dcab6d52b19162d0c757cd))
* support LanguageModelV2 / ai sdk v5 ([#8](https://github.com/axiomhq/ai/issues/8)) ([1dae459](https://github.com/axiomhq/ai/commit/1dae4591cdc08763bebe01fd8b55ce8bfeb99b3f))
* update span shape / semantic conventions ([#7](https://github.com/axiomhq/ai/issues/7)) ([376e5d5](https://github.com/axiomhq/ai/commit/376e5d50b6be48a44d9052b8e99e5e6547d52501))


### Bug Fixes

* **test:** coverage and missing deps ([#4](https://github.com/axiomhq/ai/issues/4)) ([0b8952f](https://github.com/axiomhq/ai/commit/0b8952f095712f2b88abfd7556bff566c6716dd9))

## Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
