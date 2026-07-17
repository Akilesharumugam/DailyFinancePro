import { ArrowUpRight, CalendarDays, CircleAlert, IndianRupee, Plus, ReceiptIndianRupee, Target, WalletCards } from "lucide-react";
import { Metric, Status } from "@/components/ui";

const collections = [
  ["PS", "Prakash Sharma", "98765 43210", "Sai Monthly Chit", "12 / 20", "₹2,500", "UPI", "Ramesh Kumar", "09:12 AM"],
  ["AS", "Anita Singh", "98765 43211", "Durga Daily Chit", "15 / 30", "₹1,500", "Cash", "Suresh Yadav", "09:45 AM"],
  ["RK", "Ravi Kumar", "98765 43212", "Sai Monthly Chit", "12 / 20", "₹2,500", "UPI", "Ramesh Kumar", "10:02 AM"],
  ["MP", "Meena Patel", "98765 43213", "Lakshmi Weekly Chit", "8 / 25", "₹1,000", "Card", "Pooja Verma", "10:35 AM"],
  ["VG", "Vijay Gupta", "98765 43214", "Durga Daily Chit", "16 / 30", "₹1,500", "Cash", "Suresh Yadav", "11:05 AM"],
];

export default function DashboardPage() {
  return <>
    <section className="overview-band">
      <div><span className="overview-icon green"><IndianRupee /></span><p>Collected<strong>₹24,500</strong></p></div>
      <div><span className="overview-icon blue"><ArrowUpRight /></span><p>Transactions<strong>18</strong></p></div>
      <div><span className="overview-icon orange"><CalendarDays /></span><p>Due Today<strong>42</strong></p></div>
    </section>
    <section className="metric-grid">
      <Metric label="Total Portfolio" value="₹8,40,000" detail="Total active amount" tone="blue" icon={WalletCards} />
      <Metric label="Collected" value="₹5,12,300" detail="60.9% of portfolio" tone="green" icon={ArrowUpRight} />
      <Metric label="Pending" value="₹3,27,700" detail="39.1% of portfolio" tone="orange" icon={ReceiptIndianRupee} />
      <Metric label="Overdue" value="₹42,600" detail="13 customers require follow-up" tone="red" icon={CircleAlert} />
    </section>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-title"><div><h2>7-Day Collection Trend</h2><p>Daily collection performance</p></div><select aria-label="Collection period"><option>This week</option></select></div><div className="chart"><div className="axis"><span>₹40K</span><span>₹30K</span><span>₹20K</span><span>₹10K</span><span>₹0</span></div><svg viewBox="0 0 660 210" role="img" aria-label="Collection trend from 11 to 17 July"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1769e0" stopOpacity=".2"/><stop offset="1" stopColor="#1769e0" stopOpacity="0"/></linearGradient></defs><path className="grid-lines" d="M0 18H650M0 60H650M0 102H650M0 144H650M0 186H650"/><path className="chart-area" d="M18 145 L120 115 L220 82 L322 105 L424 55 L525 70 L630 94 L630 186 L18 186Z"/><path className="chart-line" d="M18 145 L120 115 L220 82 L322 105 L424 55 L525 70 L630 94"/>{[[18,145],[120,115],[220,82],[322,105],[424,55],[525,70],[630,94]].map(([x,y])=><circle key={x} cx={x} cy={y} r="5" />)}</svg><div className="chart-labels"><span>11 Jul</span><span>12 Jul</span><span>13 Jul</span><span>14 Jul</span><span>15 Jul</span><span>16 Jul</span><span>17 Jul</span></div></div></article>
      <article className="panel target-panel"><div className="panel-title"><div><h2><Target />Today&apos;s Target</h2><p>82% achieved by 11:05 AM</p></div><button className="text-button">Refresh</button></div><div className="target-value"><strong>₹24,500</strong><span>of ₹30,000</span><em>81.67%</em></div><div className="progress"><span style={{width:"81.67%"}} /></div><div className="target-stats"><div><strong>₹24,500</strong><span>Collected</span></div><div><strong>₹5,500</strong><span>Remaining</span></div><div><strong>18</strong><span>Transactions</span></div></div></article>
    </section>
    <section className="panel table-panel"><div className="panel-title table-title"><div><h2>Today&apos;s Collections</h2><div className="segmented"><button className="active">Today</button><button>This week</button><button>This month</button></div></div><div><button className="secondary-button"><Plus />Add customer</button><button className="primary-button"><Plus />Record collection</button></div></div><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Chit Group</th><th>Installment</th><th>Amount</th><th>Payment Mode</th><th>Agent</th><th>Time / Status</th></tr></thead><tbody>{collections.map((row)=><tr key={row[1]}><td><div className="person-cell"><span>{row[0]}</span><div><strong>{row[1]}</strong><small>{row[2]}</small></div></div></td><td>{row[3]}</td><td>{row[4]}</td><td className="money">{row[5]}</td><td>{row[6]}</td><td>{row[7]}</td><td>{row[8]} <Status>Paid</Status></td></tr>)}</tbody></table></div></section>
    <section className="bottom-grid"><article className="panel"><div className="panel-title"><h2>Collection Agent Performance</h2><select><option>Today</option></select></div><div className="agent-list">{[["Ramesh Kumar","₹9,800","82%"],["Suresh Yadav","₹7,300","73%"],["Pooja Verma","₹3,400","57%"],["Arun Kumar","₹2,000","50%"]].map(([name,total,pct])=><div key={name}><strong>{name}</strong><span>{total}</span><div className="mini-progress"><i style={{width:pct}} /></div><em>{pct}</em></div>)}</div></article><article className="panel"><div className="panel-title"><h2>Recent Activity</h2><button className="text-button">View all</button></div><div className="activity-list"><p><span>✓</span><strong>Collection of ₹2,500 recorded</strong><small>Prakash Sharma · 09:12 AM</small></p><p><span>✓</span><strong>Collection of ₹1,500 recorded</strong><small>Anita Singh · 09:45 AM</small></p><p><span>+</span><strong>New customer Meena Patel added</strong><small>by Pooja Verma · 10:18 AM</small></p><p className="warn"><span>!</span><strong>Payment overdue for 3 customers</strong><small>Follow-up required</small></p></div></article></section>
  </>;
}
