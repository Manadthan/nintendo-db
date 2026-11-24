# Fixtures des guides japonais (étape 29, ADR-19 point 7)

Copies relevées le 24/11/2026 depuis la session Claude, jamais appelées en direct par les tests :

- `ndl-splatoon-3.xml`, `ndl-xenoblade.xml`, `ndl-pikmin.xml` : NDL Search, API OpenSearch,
  `https://ndlsearch.ndl.go.jp/api/opensearch?mediatype=books&cnt=50&title=…` (titres スプラトゥーン3, ゼノブレイド, ピクミン).
- `google-9784047336926.json` (PIKMIN4 パーフェクトガイド, avec vignette) et `google-9784866906911.json`
  (スプラトゥーン3 イカす攻略パラダイス, sans vignette) : Google Books, `volumes?q=isbn:…&country=JP`.
