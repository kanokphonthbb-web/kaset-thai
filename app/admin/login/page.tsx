import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default function AdminLogin({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const input =
    "w-full rounded-lg border border-ash bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink";
  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl bg-paper p-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>🌾</span>
          <span className="font-display text-lg font-bold text-ink">
            เกษตรกรไทย · หลังบ้าน
          </span>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-stone">สำหรับผู้ดูแลระบบเท่านั้น</p>

        {searchParams.error && (
          <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            อีเมลหรือรหัสผ่านไม่ถูกต้อง
          </p>
        )}

        <form action={loginAction} className="mt-5 space-y-4">
          <input type="hidden" name="next" value={searchParams.next ?? "/admin"} />
          <label className="block">
            <span className="text-xs font-semibold text-stone">อีเมล</span>
            <input name="email" type="email" autoComplete="username" className={`${input} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-stone">รหัสผ่าน</span>
            <input name="password" type="password" autoComplete="current-password" className={`${input} mt-1`} />
          </label>
          <button className="w-full rounded-full bg-lime-canopy px-4 py-2.5 text-sm font-semibold text-ink hover:bg-lime-deep">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}
