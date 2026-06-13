import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">プライバシーポリシー</h1>
        <p className="text-sm text-gray-400">Privacy Policy — 最終更新：2026年5月19日</p>
      </div>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        {/* 1 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            1. 事業者情報
          </h2>
          <p>
            本プライバシーポリシーは、DTV Portal（以下「本サービス」）を運営する事業者が、
            申請者の個人情報をどのように収集・利用・管理するかを定めるものです。
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            2. 収集する個人情報
          </h2>
          <p className="mb-3">本サービスは、DTV申請処理のために以下の情報を収集します。</p>
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-2/5">情報の種類</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">収集目的</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["氏名（姓・名・ミドルネーム）", "申請者の識別"],
                ["メールアドレス", "ログイン・通知メール送信"],
                ["国籍・申請先領事館", "申請先の管理"],
                ["パスポート写真ページ", "DTV申請書類として使用"],
                ["残高証明書", "DTV申請書類として使用"],
                ["顔写真", "DTV申請書類として使用"],
                ["滞在証明書類", "DTV申請書類として使用"],
                ["申請ステータス履歴", "申請進捗の記録・問い合わせ対応"],
              ].map(([info, purpose]) => (
                <tr key={info}>
                  <td className="px-3 py-2 text-gray-700">{info}</td>
                  <td className="px-3 py-2 text-gray-500">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            3. 個人情報の利用目的
          </h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>タイDTV（Destination Thailand Visa）の申請代行サービスの提供</li>
            <li>申請ステータスの管理および申請者への通知</li>
            <li>担当者からのフィードバック・連絡</li>
            <li>申請完了後のお問い合わせ対応</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            4. データ保持期間
          </h2>
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-xs mb-3">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-2/5">ケース</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">保持期間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-3 py-2 text-gray-700">DTV承認済み</td>
                <td className="px-3 py-2 text-gray-500">承認日から <strong>5年間</strong></td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-700">申請却下・未完了</td>
                <td className="px-3 py-2 text-gray-500">最終更新日から <strong>1年間</strong></td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-700">削除リクエスト受領後</td>
                <td className="px-3 py-2 text-gray-500"><strong>30日以内</strong>に削除</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            ※ DTV（Destination Thailand Visa）は最長5年の有効期限を持つビザです。
            有効期間中のお問い合わせに対応するため、承認後5年間データを保持します。
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            5. 第三者提供
          </h2>
          <p className="mb-2">
            収集した個人情報は、以下の場合を除き第三者に提供しません。
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>DTV申請のために必要なタイ大使館・領事館への提出</li>
            <li>法令に基づく開示要求がある場合</li>
            <li>申請者本人の同意がある場合</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            6. 安全管理措置
          </h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>通信はSSL/TLSにより暗号化されています</li>
            <li>データはSupabase（AWS ap-southeast-1）に安全に保存されています</li>
            <li>書類ファイルへのアクセスは認証済みユーザーのみに制限されています</li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            7. ご本人の権利
          </h2>
          <p className="mb-2">申請者は以下の権利を有します。</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>保有する個人情報の開示請求</li>
            <li>個人情報の訂正・削除の請求</li>
            <li>個人情報の利用停止の請求</li>
          </ul>
          <p className="mt-3">
            これらの権利行使をご希望の場合は、担当者までメールにてご連絡ください。
            削除リクエストは受領から<strong>30日以内</strong>に対応いたします。
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            8. Cookie・ローカルストレージの使用
          </h2>
          <p>
            本サービスは、ログイン状態の維持にCookieおよびセッション情報を使用します。
            広告目的のトラッキングは行いません。
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
            9. ポリシーの変更
          </h2>
          <p>
            本ポリシーは必要に応じて改定することがあります。
            重要な変更の場合は本サービス上でお知らせします。
          </p>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between">
        <p className="text-xs text-gray-400">© 2026 DTV Portal. All rights reserved.</p>
        <Link
          href="/login"
          className="text-xs text-blue-500 hover:underline"
        >
          ← ログインページへ戻る
        </Link>
      </div>
    </div>
  );
}
