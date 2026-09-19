"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Copy,
  Grid2X2,
  KeyRound,
  Lock,
  Menu,
  MoreHorizontal,
  Search,
  Settings2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useChainlinkPrice } from "./hooks/useChainlinkPrice";
import TradingViewWidget from "./components/TradingViewWidget";

type Screen = "landing" | "code" | "app" | "admin";
type Side = "LONG" | "SHORT";
type WaitlistEntry = { id: number; email: string; status: "Pending" | "Approved"; code: string | null };

type Market = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
};

const MARKETS: Market[] = [
  { symbol: "BTC", name: "Bitcoin", price: "—", change: "+2.84%", volume: "$2.4B" },
  { symbol: "ETH", name: "Ethereum", price: "$4,721.83", change: "+1.92%", volume: "$1.8B" },
  { symbol: "SOL", name: "Solana", price: "$241.18", change: "+4.31%", volume: "$921M" },
  { symbol: "BNB", name: "BNB", price: "$1,012.44", change: "+0.88%", volume: "$612M" },
  { symbol: "XRP", name: "XRP", price: "$2.91", change: "-1.08%", volume: "$488M" },
  { symbol: "DOGE", name: "Dogecoin", price: "$0.29", change: "+3.72%", volume: "$404M" },
  { symbol: "AVAX", name: "Avalanche", price: "$38.52", change: "+2.17%", volume: "$218M" },
  { symbol: "LINK", name: "Chainlink", price: "$26.48", change: "+1.31%", volume: "$194M" },
  { symbol: "SUI", name: "Sui", price: "$4.02", change: "+5.12%", volume: "$181M" },
  { symbol: "ARB", name: "Arbitrum", price: "$0.88", change: "-0.44%", volume: "$126M" },
];

async function api(action: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`hex-mark ${small ? "hex-mark-small" : ""}`} aria-label="HEXAGONAL">
      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="hex-gradient" x1="8" y1="12" x2="92" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3194FF" />
            <stop offset="0.52" stopColor="#4169FF" />
            <stop offset="1" stopColor="#8B45FF" />
          </linearGradient>
        </defs>
        <path d="M50 5 88.97 27.5v45L50 95 11.03 72.5v-45L50 5Z" stroke="url(#hex-gradient)" strokeWidth="9" />
        <path d="M42 27v18l16 9v18l-16 9M58 27v18l-16 9v18l16 9" stroke="url(#hex-gradient)" strokeWidth="8" strokeLinecap="square" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function CoinIcon({ symbol }: { symbol: string }) {
  return <span className={`coin-icon coin-${symbol.toLowerCase()}`}>{symbol.slice(0, 1)}</span>;
}

export default function HexagonalTrade() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [menuOpen, setMenuOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  const [codeEmail, setCodeEmail] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");

  const { price, loading, error } = useChainlinkPrice();
  const [balance, setBalance] = useState(10000);
  const [position, setPosition] = useState<Side | null>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [leverage, setLeverage] = useState(10);
  const [tradeAmount, setTradeAmount] = useState("100");
  const [selectedMarket, setSelectedMarket] = useState("BTC");
  const [marketSearch, setMarketSearch] = useState("");
  const [orderType, setOrderType] = useState("Market");

  const currentPrice = selectedMarket === "BTC" ? price : null;
  const displayPrice = currentPrice ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : selectedMarket === "BTC" ? (loading ? "—" : "N/A") : MARKETS.find((m) => m.symbol === selectedMarket)?.price ?? "—";
  const filteredMarkets = useMemo(() => MARKETS.filter((m) => `${m.symbol} ${m.name}`.toLowerCase().includes(marketSearch.toLowerCase())), [marketSearch]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setWaitlistError("");
    const { ok, data } = await api("waitlist", { email });
    setSubmitting(false);
    if (ok) { setIsSubmitted(true); setEmail(""); }
    else setWaitlistError(data.error || "Gagal daftar, coba lagi.");
  };

  const loadAdmin = async () => {
    setAdminError("");
    const { ok, data } = await api("admin-list", { password: adminPassword });
    if (ok) { setWaitlist(data.list); setIsAdminUnlocked(true); }
    else setAdminError(data.error || "Password salah");
  };

  const handleApprove = async (id: number) => {
    const { ok, data } = await api("approve", { password: adminPassword, id });
    if (!ok) { alert(data.error || "Gagal approve"); return; }
    if (!data.emailSent) alert(`Approved, tapi email gagal terkirim. Kirim manual kode ini: ${data.code}`);
    loadAdmin();
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok } = await api("unlock", { email: codeEmail, code: codeInput });
    if (ok) { setCodeError(""); setScreen("app"); }
    else setCodeError("Email atau kode salah.");
  };

  const Header = () => (
    <header className="app-header">
      <button className="brand" onClick={() => setScreen("landing")}>
        <LogoMark small />
        <span>HEXAGONAL</span>
      </button>
      <div className="header-center"><span className="live-dot" /> TESTNET · DEMO ENVIRONMENT</div>
      <div className="header-actions">
        {screen === "app" && <button className="icon-button" title="Settings"><Settings2 size={17} /></button>}
        <button className="menu-button" onClick={() => setMenuOpen(true)}><Menu size={19} /><span>Menu</span></button>
      </div>
    </header>
  );

  const SideMenu = () => menuOpen && (
    <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-top"><div className="brand"><LogoMark small /><span>HEXAGONAL</span></div><button className="icon-button" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
        <nav className="drawer-nav">
          <button onClick={() => { setScreen("landing"); setMenuOpen(false); }}><Grid2X2 size={16} /> Home</button>
          <button onClick={() => { setScreen("app"); setMenuOpen(false); }}><BarChart3 size={16} /> Trade</button>
          <button onClick={() => { setScreen("admin"); setMenuOpen(false); }}><ShieldCheck size={16} /> Admin</button>
        </nav>
        <div className="drawer-footer"><span>HEXAGONAL</span><small>Trade beyond boundaries.</small></div>
      </aside>
    </div>
  );

  if (screen === "landing") return (
    <div className="site-shell"><Header /><SideMenu />
      <main className="landing">
        <div className="landing-glow landing-glow-one" /><div className="landing-glow landing-glow-two" />
        <div className="hero-logo"><LogoMark /></div>
        <div className="eyebrow"><span /> HEXAGONAL TESTNET <span /></div>
        <h1>TRADE BEYOND<br /><em>BOUNDARIES.</em></h1>
        <p>Experience a purpose-built perpetual trading interface with a realistic demo environment, live oracle pricing, and zero financial risk.</p>
        {isSubmitted ? <div className="success-box"><CheckCircle2 size={17} /> Registered — watch your inbox for access approval.</div> : (
          <form className="waitlist-form" onSubmit={handleWaitlistSubmit}>
            <div className="input-wrap"><span>EMAIL</span><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <button disabled={submitting}>{submitting ? "JOINING..." : "JOIN WAITLIST"}<ArrowRight size={15} /></button>
            {waitlistError && <small className="error-text">{waitlistError}</small>}
          </form>
        )}
        <button className="access-link" onClick={() => setScreen("code")}><KeyRound size={13} /> Already have an access code?</button>
        <div className="hero-stats"><span><ShieldCheck size={14} /> Demo funds only</span><span><Zap size={14} /> Oracle-powered</span><span><Activity size={14} /> Real-time UI</span></div>
      </main>
    </div>
  );

  if (screen === "code") return (
    <div className="site-shell"><Header /><SideMenu /><main className="center-page"><div className="auth-card"><div className="auth-icon"><KeyRound size={18} /></div><p className="eyebrow plain">ACCESS GATE</p><h2>Enter your access code</h2><p>Use the code sent to your approved email address.</p><form onSubmit={handleUnlock}><input type="email" placeholder="Email address" value={codeEmail} onChange={(e) => setCodeEmail(e.target.value)} required /><input className="mono-input" placeholder="ACCESS CODE" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} required /><button>ENTER TESTNET <ArrowRight size={15} /></button>{codeError && <small className="error-text">{codeError}</small>}</form><button className="text-link" onClick={() => setScreen("landing")}>Back to waitlist</button></div></main></div>
  );

  if (screen === "admin") return (
    <div className="site-shell"><Header /><SideMenu /><main className="admin-page">{isAdminUnlocked ? <section className="admin-card"><div className="section-heading"><div><p className="eyebrow plain">CONTROL CENTER</p><h2>Waitlist approval</h2></div><button className="secondary-button" onClick={loadAdmin}>Refresh</button></div><div className="table-wrap"><table><thead><tr><th>Email</th><th>Status</th><th>Code</th><th /></tr></thead><tbody>{waitlist.map((u) => <tr key={u.id}><td>{u.email}</td><td><span className={`status ${u.status.toLowerCase()}`}>{u.status}</span></td><td className="mono">{u.code ?? "—"}</td><td className="right">{u.status === "Pending" ? <button className="approve" onClick={() => handleApprove(u.id)}>Approve</button> : "—"}</td></tr>)}</tbody></table>{!waitlist.length && <div className="empty-state">No waitlist entries yet.</div>}</div></section> : <div className="auth-card admin-auth"><div className="auth-icon"><Lock size={18} /></div><p className="eyebrow plain">CONTROL CENTER</p><h2>Admin access</h2><input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />{adminError && <small className="error-text">{adminError}</small>}<button onClick={loadAdmin}>UNLOCK <ArrowRight size={15} /></button></div>}</main></div>
  );

  return (
    <div className="trading-shell"><Header /><SideMenu />
      <main className="trading-layout">
        <aside className="markets-panel panel">
          <div className="panel-title"><div><span className="eyebrow plain">MARKETS</span><h3>Perpetuals</h3></div><MoreHorizontal size={17} className="muted" /></div>
          <div className="search-box"><Search size={14} /><input placeholder="Search markets" value={marketSearch} onChange={(e) => setMarketSearch(e.target.value)} /></div>
          <div className="market-tabs"><span className="active">All</span><span>Majors</span><span>Altcoins</span></div>
          <div className="market-head"><span>Market</span><span>24h</span></div>
          <div className="market-list">{filteredMarkets.map((m) => <button key={m.symbol} className={`market-row ${selectedMarket === m.symbol ? "selected" : ""}`} onClick={() => { if (!position) setSelectedMarket(m.symbol); }}><div className="market-name"><CoinIcon symbol={m.symbol} /><div><strong>{m.symbol}-USD</strong><small>{m.name}</small></div></div><div className="market-data"><strong>{m.price}</strong><span className={m.change.startsWith("-") ? "negative" : "positive"}>{m.change}</span></div></button>)}</div>
        </aside>

        <section className="main-market">
          <div className="market-header panel"><div className="pair-block"><CoinIcon symbol={selectedMarket} /><div><div className="pair-title"><h1>{selectedMarket}/USD</h1><span>PERP</span></div><p>Chainlink Oracle <i>•</i> Demo Perpetual</p></div></div><div className="ticker"><strong>{displayPrice}</strong><span className={selectedMarket === "BTC" ? "positive" : "positive"}>+2.84%</span></div></div>
          <div className="metrics panel"><div><span>MARK PRICE</span><strong>{displayPrice}</strong></div><div><span>ORACLE</span><strong>CHAINLINK</strong></div><div><span>24H CHANGE</span><strong className="positive">+2.84%</strong></div><div><span>24H VOLUME</span><strong>$2.40B</strong></div></div>
          <div className="chart panel"><div className="chart-top"><div className="timeframes"><span>1m</span><span>5m</span><span className="active">15m</span><span>1H</span><span>4H</span><span>1D</span></div><div className="chart-actions"><span>TradingView</span><BarChart3 size={14} /></div></div><div className="chart-canvas"><TradingViewWidget /></div></div>
          <div className="positions panel"><div className="section-heading"><div><span className="eyebrow plain">PORTFOLIO</span><h3>{position ? "Open position" : "No open positions"}</h3></div><span className="demo-tag">DEMO BALANCE · ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>{position && entryPrice && currentPrice ? (() => { const pct = ((currentPrice - entryPrice) / entryPrice) * (position === "LONG" ? 1 : -1); const pnl = (Number(tradeAmount) || 0) * leverage * pct; return <div className="position-row"><div><span className={`side-badge ${position.toLowerCase()}`}>{position}</span><strong>{selectedMarket}-USD</strong><small>{leverage}x · Entry ${entryPrice.toFixed(2)}</small></div><div><small>UNREALIZED P&L</small><strong className={pnl >= 0 ? "positive" : "negative"}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}</strong></div><button className="secondary-button" onClick={() => { setBalance((b) => b + pnl); setPosition(null); setEntryPrice(null); }}>Close</button></div>; })() : <div className="empty-position"><Activity size={17} /> Your open positions will appear here.</div>}</div>
        </section>

        <aside className="order-panel panel">
          <div className="order-heading"><div><span className="eyebrow plain">ORDER ENTRY</span><h2>Trade {selectedMarket}/USD</h2></div><button className="icon-button"><Settings2 size={16} /></button></div>
          <div className="order-tabs"><button className="active">Market</button><button onClick={() => setOrderType("Limit")} className={orderType === "Limit" ? "active" : ""}>Limit</button></div>
          <div className="leverage-row"><span>Leverage</span><strong>{leverage}x</strong></div>
          <input type="range" min="1" max="50" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="leverage-slider" />
          <div className="leverage-presets">{[2, 5, 10, 20, 35].map((x) => <button key={x} className={leverage === x ? "active" : ""} onClick={() => setLeverage(x)}>{x}x</button>)}</div>
          <div className="available"><span>Available to trade</span><strong>${balance.toFixed(2)}</strong></div>
          <label className="field-label">Order size <span>USD</span></label><div className="field"><input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} /><span>USD</span></div>
          <div className="size-presets">{[25, 50, 75, 100].map((x) => <button key={x} onClick={() => setTradeAmount(((balance * x) / 100).toFixed(2))}>{x}%</button>)}</div>
          <div className="tp-row"><label><span>Take Profit</span><input placeholder="Optional" /></label><label><span>Stop Loss</span><input placeholder="Optional" /></label></div>
          <div className="order-summary"><div><span>Est. Position Size</span><strong>${((Number(tradeAmount) || 0) * leverage).toFixed(2)}</strong></div><div><span>Entry Price</span><strong>{displayPrice}</strong></div></div>
          <div className="trade-buttons"><button className="long-button" onClick={() => { if (selectedMarket === "BTC" && price) { setPosition("LONG"); setEntryPrice(price); } }}><TrendingUp size={16} /> Long</button><button className="short-button" onClick={() => { if (selectedMarket === "BTC" && price) { setPosition("SHORT"); setEntryPrice(price); } }}><TrendingDown size={16} /> Short</button></div>
          <div className="wallet-note"><Wallet size={14} /><span>Demo environment · No real funds</span></div>
        </aside>
      </main>
      <div className="mobile-nav"><button className="active"><BarChart3 size={17} /><span>Trade</span></button><button><ArrowDownUp size={17} /><span>Markets</span></button><button><Wallet size={17} /><span>Portfolio</span></button><button><Settings2 size={17} /><span>Settings</span></button></div>
    </div>
  );
}
