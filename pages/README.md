# GitHub Pages 同一ページ参加版

イベント情報の最後尾に、GASの参加フォーム・一覧・編集だけをiframeで表示します。通常の参加操作は同じページ内で完結します。`settings.json` に既存の `/exec` を設定済みですが、`registrationReady=false` のため現在は「参加受付は準備中」と表示します。[埋め込みの保護と必要な承認](../apps-script-embed/README.md)を確認してください。

Google側で埋め込み許可と匿名アクセスへの変更を承認した後、確認用のPagesで次を設定して実環境テストを行います。成功するまでは正式案内しません。

```json
{
  "appsScriptUrl": "https://script.google.com/macros/s/確認済みデプロイID/exec",
  "registrationReady": true
}
```

シートID、編集パス、秘密値、Googleのトークンは書きません。Pagesへ実データを保存しません。相対パスを使うため `https://kurokikaren000.github.io/animad/` のようなプロジェクトパスで表示できます。

## 公開手順（公開の承認後）

1. リポジトリへソースを保存する。
2. GitHubの Settings → Pages → Build and deployment の Source を GitHub Actions にする。
3. `.github/workflows/pages.yml` がリポジトリにあることを確認する。
4. Actions → Publish Pages → Run workflow を実行する。
5. デプロイ結果のURLで、画像・全区分・注意事項・末尾のフォーム・一覧・編集・再読込を確認する。

このワークフローは手動起動のみです。pushだけではデプロイは動きません。GitHub Pagesのbranch設定は通常rootまたはdocsが対象のため、`/pages` をbranchフォルダ指定できる前提にはしていません。

生成元は `public/` と `event.json`。変更後は `npm run build:gas`。`settings.json` とこのREADMEはビルドで上書きしません。GAS側の設定は [apps-script/README.md](../apps-script/README.md) を参照してください。
