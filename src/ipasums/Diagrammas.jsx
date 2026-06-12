import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { C as DS } from '../ds'
import { SORT_NOS, SORT_CENAS, SORT_KRASA } from './constants'

export default function IpasumDiagrammas({
  editData, dapTer,
  kopPlatiba, kopKubatura, kopIndVert,
  domSuga, vidVecums,
}) {
  const C   = { card: DS.bgCard, border: DS.greenBdr, sec: DS.textSec, dim: DS.textDim, green: DS.green, text: DS.text }
  const tpS = { background: DS.bgCard, border:`1px solid ${DS.greenBdr}`, borderRadius:8, fontSize:11, color: DS.text }
  const tkS = { fill: DS.textDim, fontSize:10 }

  const sugasPaPlat = editData.reduce((acc,n) => {
    acc[n.sugaNos] = (acc[n.sugaNos]||0) + n.platiba; return acc
  }, {})

  const pieData = Object.entries(sugasPaPlat).map(([nos, ha]) => ({
    name:nos, value: Math.round(ha*100)/100,
    krasa: editData.find(n=>n.sugaNos===nos)?.sugaKrasa || '#4caf50',
  }))

  const barKub = editData.filter(n=>n.kubatura>0).map(n=>({ name:n.nr_text, m3:n.kubatura, fill:n.sugaKrasa }))
  const barVert= editData.filter(n=>n.sortVert>0).map(n=>({ name:n.nr_text, eur:n.sortVert, fill:n.sugaKrasa }))

  const sortKopa = editData.reduce((acc,n) => {
    Object.entries(n.sortimenti).forEach(([k,v]) => { acc[k]=(acc[k]||0)+(v||0) }); return acc
  }, {})
  const sortPieData = Object.entries(sortKopa).filter(([,v])=>v>0.5)
    .map(([k,v]) => ({ name: SORT_NOS[k]||k, value: Math.round(v), fill: SORT_KRASA[k]||'#4caf50' }))
  const sortBar = Object.entries(sortKopa).filter(([,v])=>v>0.5)
    .map(([k,v]) => ({ name: SORT_NOS[k]||k, m3: Math.round(v), eur: Math.round(v*(SORT_CENAS[k]||0)) }))

  const bloks = (title, children) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:12 }}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 80px' }}>

      {pieData.length > 0 && bloks('📊 Platības sadalījums pa sugām',
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={30}
              label={({name,value,percent})=>`${name} ${value}ha (${(percent*100).toFixed(0)}%)`}
              labelLine={{ stroke:C.sec, strokeWidth:1 }}>
              {pieData.map((e,i) => <Cell key={i} fill={e.krasa} />)}
            </Pie>
            <Tooltip contentStyle={tpS} formatter={v=>[`${v} ha`,'Platība']} />
          </PieChart>
        </ResponsiveContainer>
      )}

      {barKub.length > 0 && bloks('🪵 Kubatūra pa nogabaliem (m³)',
        <ResponsiveContainer width="100%" height={Math.min(220, barKub.length*32+60)}>
          <BarChart data={barKub} layout="vertical" margin={{ left:30, right:20 }}>
            <XAxis type="number" tick={tkS} />
            <YAxis type="category" dataKey="name" tick={{ ...tkS, fontSize:11 }} width={50} />
            <Tooltip contentStyle={tpS} formatter={v=>[`${v} m³`,'Kubatūra']} />
            <Bar dataKey="m3" radius={[0,4,4,0]}>
              {barKub.map((e,i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {barVert.length > 0 && bloks('💰 Vērtība pa nogabaliem (€)',
        <ResponsiveContainer width="100%" height={Math.min(220, barVert.length*32+60)}>
          <BarChart data={barVert} layout="vertical" margin={{ left:30, right:20 }}>
            <XAxis type="number" tick={tkS} />
            <YAxis type="category" dataKey="name" tick={{ ...tkS, fontSize:11 }} width={50} />
            <Tooltip contentStyle={tpS} formatter={v=>[`${v.toLocaleString()} €`,'Vērtība']} />
            <Bar dataKey="eur" radius={[0,4,4,0]}>
              {barVert.map((e,i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {sortPieData.length > 0 && bloks('🪵 Sortimentu sadalījums (m³)',
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={sortPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={28}
              label={({name,value})=>`${name} ${value}m³`} labelLine={{ stroke:C.sec, strokeWidth:1 }}>
              {sortPieData.map((e,i) => <Cell key={i} fill={e.fill} />)}
            </Pie>
            <Tooltip contentStyle={tpS} formatter={v=>[`${v} m³`,'Apjoms']} />
          </PieChart>
        </ResponsiveContainer>
      )}

      {sortBar.length > 0 && bloks('💰 Sortimentu sadalījums (m³ un €)',
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sortBar} margin={{ bottom:40 }}>
            <XAxis dataKey="name" tick={{ ...tkS, fontSize:9 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={tkS} />
            <Tooltip contentStyle={tpS} formatter={(v,n) => [`${v.toLocaleString()} ${n==='eur'?'€':'m³'}`, n==='eur'?'Vērtība':'Apjoms']} />
            <Bar dataKey="m3" name="m3" radius={[4,4,0,0]}>
              {sortBar.map((e,i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
            <Bar dataKey="eur" name="eur" radius={[4,4,0,0]}>
              {sortBar.map((e,i) => <Cell key={i} fill={`${e.fill}99`} />)}
            </Bar>
            <Legend formatter={v=>v==='m3'?'m³':'€'} wrapperStyle={{ color:C.dim, fontSize:11 }} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {bloks('🌲 Kopsavilkums',
        [
          ['Kopplatība',                    `${kopPlatiba.toFixed(2)} ha`      ],
          ['Dominējošā suga',               domSuga                            ],
          ['Vidējais vecums',               `${vidVecums} gadi`                ],
          ['Kopkubatūra (G×H×0.45×ha)',     `${kopKubatura.toFixed(0)} m³`     ],
          ['Indikatīvā vērtība (×35€/m³)',  `${kopIndVert.toLocaleString()} €` ],
          ...(dapTer.length>0 ? [['⚠️ Egļu aizsardzības zonas', `${dapTer.length} gab.`]] : []),
        ].map(([k,v],i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
            borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
            <span style={{ color:C.sec }}>{k}</span>
            <span style={{ color:C.text, fontWeight:600 }}>{v}</span>
          </div>
        ))
      )}
    </div>
  )
}
