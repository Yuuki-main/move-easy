export const metadata = {
  title: 'Privacy Policy | Moving Easy',
  description:
    'Learn how Moving Easy collects, uses, and protects your personal information.',
}

const SECTIONS = [
  {
    title: '1. Scope',
    body: 'This Privacy Policy applies to personal information collected through the Moving Easy website, including information collected from customers submitting requests, carriers using the website, users communicating through the website, and visitors browsing the website.',
  },
  {
    title: '2. Information we collect',
    body: 'We may collect personal information that you provide directly to us or through your use of the website, including: your name, email address, phone number, address details, pickup and delivery information, item descriptions, photos, and instructions, account and login details, messages and other communications submitted through the website, quotes, bookings, transaction records, reviews, and feedback. We may also collect technical and usage information such as IP address, browser type, device information, pages viewed, actions taken on the website, and cookie data.',
  },
  {
    title: '3. How we use personal information',
    body: 'We may use personal information to operate, maintain, and improve the website; enable quote requests, bookings, and related activity; allow users to communicate through the website; process payments, charges, or fees; provide customer support; verify accounts or information provided; monitor compliance with our Terms and other website rules; investigate disputes, complaints, suspicious activity, or possible breaches; prevent fraud, misuse, unauthorised activity, or attempts to bypass the website; comply with legal, regulatory, accounting, and compliance obligations; and develop, test, and improve our services, features, and systems.',
  },
  {
    title: '4. Nature of the website',
    body: 'Moving Easy operates a booking website. Moving Easy does not provide transport, moving, delivery, or carrier services itself. Carriers using the website are independent providers. Any service arrangement is between the customer and the relevant carrier. Moving Easy may process and store personal information relating to requests, quotes, bookings, payments, and communications in order to operate the website and related services.',
  },
  {
    title: '5. How information is disclosed',
    body: 'We may disclose personal information where reasonably necessary for the operation of the website and related services. This may include disclosure between customers and carriers in relation to requests, quotes, bookings, and communications; to payment providers and other service providers supporting the website; to hosting, cloud, infrastructure, analytics, communication, verification, or support providers; where required or permitted by law; where reasonably necessary to enforce our Terms or protect the website, Moving Easy, or users of the website; and in connection with a business sale, restructure, merger, acquisition, or similar transaction. We do not sell personal information.',
  },
  {
    title: '6. Payments',
    body: 'Payments made through the website may be processed by third-party payment providers. Moving Easy may store records relating to payments, charges, fees, and transaction status, but does not store full payment card details.',
  },
  {
    title: '7. Communications and website activity',
    body: 'Messages, enquiries, quote activity, booking activity, and other interactions submitted through or taking place on the website may be stored, reviewed, and used for purposes including operating the website, providing support, resolving disputes, investigating complaints, monitoring compliance with our Terms, detecting fraud, abuse, or attempts to bypass the website, and improving service quality and website functionality.',
  },
  {
    title: '8. Cookies and similar technologies',
    body: 'We may use cookies and similar technologies to keep users logged in, remember preferences, improve website performance, understand website usage, and support security and fraud prevention. You can manage cookies through your browser settings, although some parts of the website may not function properly if cookies are disabled.',
  },
  {
    title: '9. Data retention',
    body: 'We retain personal information for as long as reasonably necessary for the purposes described in this Privacy Policy, including for operational, legal, regulatory, accounting, dispute resolution, and enforcement purposes. The length of time we retain information may depend on the type of information, the nature of the user relationship, and our legal or operational requirements.',
  },
  {
    title: '10. International handling of information',
    body: 'Moving Easy may store or process personal information in countries outside the country where the information was originally collected, including where our systems, service providers, or related operations are located. Where personal information is handled across borders, we take reasonable steps to ensure it is handled with appropriate safeguards.',
  },
  {
    title: '11. Access and correction',
    body: 'Where applicable, you may request access to personal information we hold about you and request correction of that information. We may need to verify your identity before responding to a request, and we may refuse a request where permitted by law.',
  },
  {
    title: '12. Security',
    body: 'We take reasonable steps to protect personal information from loss, misuse, unauthorised access, modification, disclosure, or other misuse. However, no method of transmission over the internet or method of electronic storage is completely secure, and we cannot guarantee absolute security.',
  },
  {
    title: '13. Third-party services and links',
    body: 'The website may rely on or contain links to third-party services, websites, or systems. Those third parties may have their own terms and privacy policies, and Moving Easy is not responsible for their privacy practices.',
  },
  {
    title: '14. Changes to this Privacy Policy',
    body: 'We may update this Privacy Policy from time to time. Any updated version may be published on the website. Continued use of the website after any update may be treated as acceptance of the updated Privacy Policy.',
  },
  {
    title: '15. Privacy questions',
    body: 'If you have any questions about this Privacy Policy, about how we handle personal information, or if you would like to request access to or correction of your personal information, please contact us through our Contact Us page.',
  },
  {
    title: '16. Data deletion requests',
    body: 'You may request that we delete personal information we hold about you. To request deletion of your data, please contact us via our Contact Us page or email us at support@wisemove.co.nz, specifying your request and the account or information you would like deleted. We may need to verify your identity before processing a deletion request. Please note that we may retain certain information where required for legal, regulatory, accounting, dispute resolution, or enforcement purposes, or where retention is reasonably necessary for the operation of the website. Where deletion is possible, we will take reasonable steps to delete or de-identify the relevant personal information within a reasonable timeframe.',
  },
]

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-400 mb-12">
        Moving Easy Enterprises Pte. Ltd. (&ldquo;Moving Easy&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates a
        booking website that allows customers to request and arrange transport
        services with independent providers (&ldquo;carriers&rdquo;).
      </p>
      <p className="text-sm text-gray-600 mb-12 leading-relaxed">
        This Privacy Policy explains how we collect, use, store, and disclose
        personal information when you use our website. By using the website, you
        agree to this Privacy Policy.
      </p>

      <div className="space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {s.title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
