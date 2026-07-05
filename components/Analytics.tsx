import Script from "next/script";

// วัดผู้เข้าชม — เปิดใช้โดยตั้ง env (ถ้าไม่ตั้ง จะไม่โหลดสคริปต์ใด ๆ)
//   NEXT_PUBLIC_GA_ID           = G-XXXXXXX (Google Analytics 4)
//   NEXT_PUBLIC_PLAUSIBLE_DOMAIN = kaset-thai.com (Plausible)
export default function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <>
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {plausible && (
        <Script
          src="https://plausible.io/js/script.js"
          data-domain={plausible}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
