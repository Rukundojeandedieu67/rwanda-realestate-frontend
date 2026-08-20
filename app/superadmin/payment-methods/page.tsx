import { redirect } from 'next/navigation'

export default function PaymentMethodsPage() {
  redirect('/superadmin/settings#payment-methods')
}
