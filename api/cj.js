// CJdropshipping API proxy
// Pieņem: { path, cjEmail, cjPass, order }
// Atgriež: CJ API atbildi

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

async function getToken(email, password) {
  const r = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const d = await r.json()
  if (!d.data?.accessToken) throw new Error('CJ autentifikācija neizdevās')
  return d.data.accessToken
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { path, cjEmail, cjPass, order } = req.body
    if (!cjEmail || !cjPass) return res.status(400).json({ error: 'Nav CJ kredenciāļu' })

    const token = await getToken(cjEmail, cjPass)

    if (path === '/order/create') {
      const r = await fetch(`${CJ_BASE}/shopping/order/createOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
        body: JSON.stringify({
          orderNumber:          String(order.id),
          shippingCountryCode:  'LV',
          shippingCountry:      'Latvia',
          shippingCity:         order.customer_address?.split(',')[1]?.trim() || 'Rīga',
          shippingAddress:      order.customer_address || '',
          shippingCustomerName: order.customer_name,
          shippingPhone:        order.customer_phone || '',
          shippingZip:          '',
          products: [{
            vid:      order.supplier_api_id,
            quantity: order.quantity || 1,
          }],
        }),
      })
      const d = await r.json()
      return res.status(200).json({ cjOrderId: d.data?.orderId, raw: d })
    }

    if (path === '/order/tracking') {
      const r = await fetch(
        `${CJ_BASE}/shopping/order/getOrderDetail?orderId=${order.cj_order_id}`,
        { headers: { 'CJ-Access-Token': token } }
      )
      const d = await r.json()
      return res.status(200).json({
        tracking: d.data?.trackNumber,
        carrier:  d.data?.logisticsName,
        raw:      d,
      })
    }

    return res.status(400).json({ error: `Nezināms path: ${path}` })
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }
}
