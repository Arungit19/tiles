"use client";

import { useState, useRef, useCallback, useEffect } from "react";

function useWindowSize() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

let DEMO_USER = { username: "sumitgupta", password: "admin123" };

const COMPANY_LOGO = '/image/logo.jpg';

const COMPANY_INFO = {
  name: "JAI BALAJI BATH & TILE",
  address: "TDI City, Ashiyana Colony Ram Ganga Vihar, Moradabad, Uttar Pradesh 244001",
  phone: "+91 7417743935, +91 90455 34311",
  gstin: "27AABCT1234A1Z5",
};


// ── HELPER: Save quotation to backend ────────────────────────
async function saveQuotationToBackend(quotationData) {
  try {
    const response = await fetch('/api/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error saving quotation:', error);
    return { success: false, error: error.message };
  }
}

// ── HELPER: Fetch quotations from backend ────────────────────
async function fetchQuotationsFromBackend() {
  try {
    const response = await fetch('/api/quotations');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return [];
  }
}

// ── HELPER: Delete single quotation from backend ────────────────────
async function deleteQuotationFromBackend(quotationId) {
  try {
    console.log('Deleting quotation:', quotationId);
    
    const response = await fetch(`/api/quotations/${quotationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delete response status:', response.status);
    const result = await response.json();
    console.log('Delete response:', result);

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return { success: true, message: result.message };
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return { success: false, error: error.message };
  }
}

// ── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const w = useWindowSize();
  const sm = w < 480;

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (form.username === DEMO_USER.username && form.password === DEMO_USER.password) {
        onLogin(form.username);
      } else {
        setError("Invalid username or password.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #8B5E3C 0%, #C9956B 50%, #E8C9A0 100%)",
      fontFamily: "'Segoe UI', sans-serif", padding: "16px"
    }}>
      <div style={{
        background: "white", borderRadius: 20,
        padding: sm ? "32px 20px" : "48px 40px",
        width: "100%", maxWidth: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={COMPANY_LOGO}
            alt="JAI BALAJI BATH & TILE"
            style={{
              width: 110, height: 110, objectFit: "contain", borderRadius: 16,
              margin: "0 auto 16px", display: "block",
              filter: "drop-shadow(0 4px 12px rgba(139,94,60,0.25))"
            }}
          />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#2C1810" }}>JAI BALAJI BATH & TILE</h1>
          <p style={{ margin: "6px 0 0", color: "#8B7355", fontSize: 14 }}>Tile Quotation & Billing System</p>
        </div>
        <form onSubmit={submit}>
          {["username", "password"].map((f) => (
            <div key={f} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4A3728", marginBottom: 6, textTransform: "capitalize" }}>{f}</label>
              <input
                name={f} value={form[f]} onChange={handle}
                type={f === "password" ? "password" : "text"}
                placeholder={`Enter ${f}`}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #D5B99A",
                  fontSize: 15, outline: "none", boxSizing: "border-box", color: "#2C1810"
                }}
              />
            </div>
          ))}
          {error && (
            <div style={{
              background: "#FEE2E2", color: "#991B1B", borderRadius: 8,
              padding: "10px 14px", fontSize: 13, marginBottom: 16
            }}>{error}</div>
          )}
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #8B5E3C, #C9956B)",
            color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer"
          }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── ITEM FORM ────────────────────────────────────────────────
const emptyItem = () => ({
  id: Date.now() + Math.random(),
  photo: null, photoUrl: null,
  companyName: "", tileSize: "",
  ratePerSqft: "", qtyPerBox: "", perBoxRate: "", numBoxes: "", totalAmount: "",
});

function ItemForm({ item, index, onChange }) {
  const fileRef = useRef();
  const w = useWindowSize();
  const sm = w < 480;

  const handleChange = (field, value) => {
    const updated = { ...item, [field]: value };
    if (field === "ratePerSqft" || field === "qtyPerBox") {
      const r = parseFloat(field === "ratePerSqft" ? value : updated.ratePerSqft) || 0;
      const q = parseFloat(field === "qtyPerBox" ? value : updated.qtyPerBox) || 0;
      updated.perBoxRate = r && q ? (r * q).toFixed(2) : "";
      const n = parseFloat(updated.numBoxes) || 0;
      updated.totalAmount = updated.perBoxRate && n ? (parseFloat(updated.perBoxRate) * n).toFixed(2) : "";
    }
    if (field === "numBoxes") {
      const pbr = parseFloat(updated.perBoxRate) || 0;
      const n = parseFloat(value) || 0;
      updated.totalAmount = pbr && n ? (pbr * n).toFixed(2) : "";
    }
    onChange(updated);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ ...item, photo: file, photoUrl: url });
  };

  const inp = (field, label, placeholder, readOnly = false, type = "text") => (
    <div style={{ flex: 1, minWidth: sm ? "calc(50% - 5px)" : 150 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 5 }}>{label}</label>
      <input
        type={type} value={item[field]} readOnly={readOnly}
        onChange={e => !readOnly && handleChange(field, e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 8,
          border: readOnly ? "1.5px solid #E8D5C0" : "1.5px solid #D5B99A",
          fontSize: 14, boxSizing: "border-box", color: "#2C1810",
          background: readOnly ? "#FBF5EF" : "white", fontWeight: readOnly ? 600 : 400
        }}
      />
    </div>
  );

  return (
    <div style={{
      background: "white", borderRadius: 16, border: "1.5px solid #E8D5C0",
      padding: sm ? 14 : 24, marginBottom: 14, boxShadow: "0 2px 12px rgba(139,94,60,0.06)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F0E0D0" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #8B5E3C, #C9956B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 13
        }}>{index + 1}</div>
        <span style={{ fontWeight: 700, fontSize: sm ? 14 : 16, color: "#2C1810" }}>Tile Item #{index + 1}</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 8 }}>Tile Photo</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div onClick={() => fileRef.current.click()} style={{
            width: sm ? 72 : 90, height: sm ? 72 : 90, borderRadius: 12, border: "2px dashed #C9956B",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", overflow: "hidden", background: "#FBF5EF", flexShrink: 0
          }}>
            {item.photoUrl
              ? <img src={item.photoUrl} alt="tile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ textAlign: "center", color: "#C9956B" }}>
                  <div style={{ fontSize: sm ? 20 : 24 }}>📷</div>
                  <div style={{ fontSize: 10, marginTop: 3 }}>Upload</div>
                </div>
            }
          </div>
          <div style={{ fontSize: sm ? 12 : 13, color: "#8B7355" }}>Tap to upload tile photo.<br /><span style={{ fontSize: 11, color: "#B8A090" }}>JPG, PNG supported</span></div>
          <input type="file" accept="image/*" ref={fileRef} onChange={handlePhoto} style={{ display: "none" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        {inp("companyName", "Company Name", "e.g. Kajaria Tiles")}
        {inp("tileSize", "Tile Size", "e.g. 24x24 inches")}
        {inp("ratePerSqft", "Rate per Sq.ft (Rs.)", "e.g. 120", false, "number")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {inp("qtyPerBox", "Qty per Box (sq.ft)", "e.g. 10", false, "number")}
        {inp("perBoxRate", "Per Box Rate (Rs.) *", "Auto-calculated", true)}
        {inp("numBoxes", "Number of Boxes", "e.g. 50", false, "number")}
        {inp("totalAmount", "Total Amount (Rs.) *", "Auto-calculated", true)}
      </div>
    </div>
  );
}

// ── QUOTATION HISTORY PAGE WITH DELETE ────────────────────────
function QuotationHistoryPage({ onBack, quotationList, onQuotationDeleted, onEditQuotation }) {
  const w = useWindowSize();
  const sm = w < 480;
  const md = w < 768;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [selectedQ, setSelectedQ] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteErrors, setDeleteErrors] = useState([]);

  const fmt = (n) => {
    const num = typeof n === "string" ? parseFloat(n.replace(/,/g, "")) : n;
    return isNaN(num) ? "0.00" : num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isoDate = (d) => {
    if (!d) return "";
    if (typeof d === "string" && d.length >= 10) return d.slice(0, 10);
    return new Date(d).toISOString().split("T")[0];
  };

  const getFilteredQuotations = () => {
    let filtered = quotationList;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        (q.quotationNum || "").toLowerCase().includes(term) ||
        (q.clientInfo?.name || "").toLowerCase().includes(term)
      );
    }
    if (filterDate && filterType === "date") {
      filtered = filtered.filter(q => isoDate(q.date) === filterDate);
    }
    if (filterType === "today") {
      const today = new Date().toISOString().split("T")[0];
      filtered = filtered.filter(q => isoDate(q.date) === today);
    }
    if (filterType === "month") {
      const now = new Date();
      filtered = filtered.filter(q => {
        const qDate = new Date(isoDate(q.date) + "T00:00:00");
        return qDate.getMonth() === now.getMonth() && qDate.getFullYear() === now.getFullYear();
      });
    }
    return filtered;
  };

  const filteredQuotations = getFilteredQuotations();

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedForDelete(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredQuotations.map(q => q._id || q.id || q.quotationNum));
      setSelectedForDelete(allIds);
      setSelectAll(true);
    }
  };

  const toggleSelectOne = (id) => {
    const newSet = new Set(selectedForDelete);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForDelete(newSet);
    setSelectAll(newSet.size === filteredQuotations.length);
  };

  const handleDeleteQuotations = async () => {
    if (selectedForDelete.size === 0) return;
    
    setDeleteLoading(true);
    setDeleteCount(0);
    setDeleteErrors([]);
    let successCount = 0;
    const errors = [];

    try {
      for (const id of selectedForDelete) {
        try {
          const result = await deleteQuotationFromBackend(id);
          if (result.success) {
            successCount++;
          } else {
            errors.push(`${id}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`${id}: ${error.message}`);
        }
        setDeleteCount(prev => prev + 1);
      }
      
      setDeleteErrors(errors);
      
      if (successCount === selectedForDelete.size) {
        alert(`✅ Successfully deleted ${successCount} quotation(s)!`);
      } else if (successCount > 0) {
        alert(`⚠️ Deleted ${successCount} out of ${selectedForDelete.size} quotations\n\nErrors:\n${errors.join('\n')}`);
      } else {
        alert(`❌ Failed to delete quotations\n\nErrors:\n${errors.join('\n')}`);
      }
      
      setSelectedForDelete(new Set());
      setSelectAll(false);
      onQuotationDeleted();
    } catch (error) {
      alert("Error deleting quotations: " + error.message);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeleteCount(0);
    }
  };

  // ── PDF for history quotation ──
  const downloadHistoryPDF = async (q) => {
    setPdfLoading(true);
    try {
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = resolve; script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const jsPDF = window.jspdf?.jsPDF;
      if (!jsPDF) { alert("PDF library failed to load."); return; }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297, ML = 12, MR = 12;
      const clientInfo = q.clientInfo || {};
      const items = q.items || [];
      const taxRate = 0;
      const subtotal = q.subtotal || items.reduce((s, it) => s + (parseFloat(it.totalAmount) || 0), 0);
      const tax = 0;
      const grandTotal = subtotal;

      doc.setFillColor(201, 149, 107);
      doc.triangle(W, 0, W - 45, 0, W, 45, "F");
      doc.setFillColor(232, 200, 160);
      doc.triangle(W, 40, W - 28, 40, W, 68, "F");
      doc.setDrawColor(201, 149, 107);
      doc.setLineWidth(0.4);
      doc.rect(ML - 2, 10, W - ML - MR + 4, H - 20);

      let y = 16;
      try { doc.addImage(COMPANY_LOGO, "JPEG", ML, y - 2, 20, 20); } catch (_) {
        try { doc.addImage(COMPANY_LOGO, "PNG", ML, y - 2, 20, 20); } catch (__) {}
      }

      doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.setTextColor(139, 94, 60);
      doc.text("TILE QUOTATION", W / 2, y, { align: "center" }); y += 7;
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(74, 55, 40);
      doc.text(`Quotation No: ${q.quotationNum}     Date: ${q.date}     Valid Until: ${q.validUntil || "—"}`, W / 2, y, { align: "center" }); y += 7;
      doc.setDrawColor(201, 149, 107); doc.setLineWidth(0.3); doc.line(ML, y, W - MR, y); y += 5;

      const colMid = W / 2 + 3;
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(139, 94, 60);
      doc.text("FROM:", ML, y); doc.text("TO:", colMid, y); y += 4;
      doc.setFont("helvetica", "bold"); doc.setTextColor(44, 24, 16); doc.setFontSize(9);
      doc.text(COMPANY_INFO.name, ML, y); doc.text(clientInfo.name || "Client Name", colMid, y); y += 4;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(74, 55, 40);
      const fromLines = doc.splitTextToSize(COMPANY_INFO.address, 88);
      const toLines = doc.splitTextToSize(clientInfo.address || "-", 88);
      const maxLines = Math.max(fromLines.length, toLines.length);
      for (let i = 0; i < maxLines; i++) {
        if (fromLines[i]) doc.text(fromLines[i], ML, y);
        if (toLines[i]) doc.text(toLines[i], colMid, y);
        y += 3.8;
      }
      doc.text(`Ph: ${COMPANY_INFO.phone}`, ML, y); doc.text(`Ph: ${clientInfo.phone || "-"}`, colMid, y); y += 3.8;
      doc.text(`GSTIN: ${COMPANY_INFO.gstin}`, ML, y);
      if (clientInfo.email) doc.text(`Email: ${clientInfo.email}`, colMid, y);
      y += 7; doc.line(ML, y, W - MR, y); y += 5;

      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(44, 24, 16);
      doc.text("ITEMIZED QUOTATION DETAILS:", ML, y); y += 5;

      const usable = W - ML - MR;
      const cols = { no: { x: ML, w: 6 }, photo: { x: ML+6, w: 14 }, company: { x: ML+20, w: 36 }, size: { x: ML+56, w: 24 }, rate: { x: ML+80, w: 20 }, qty: { x: ML+100, w: 18 }, total: { x: ML+118, w: 30 } };
      const headerH = 7;
      doc.setFillColor(139, 94, 60); doc.rect(ML, y, usable, headerH, "F");
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
      doc.text("#", cols.no.x+1, y+4.5); doc.text("Photo", cols.photo.x+1, y+4.5);
      doc.text("Company/Item", cols.company.x+1, y+4.5); doc.text("Tile Size", cols.size.x+1, y+4.5);
      doc.text("Rate/sqft", cols.rate.x+1, y+4.5); doc.text("Qty/Box", cols.qty.x+1, y+4.5);
      doc.text("Total", cols.total.x+1, y+4.5); y += headerH;

      for (let i = 0; i < items.length; i++) {
        const it = items[i]; const rowH = 13;
        doc.setFillColor(i % 2 === 0 ? 251 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 239 : 255);
        doc.rect(ML, y, usable, rowH, "F");
        if (it.photoUrl) {
          try { doc.addImage(it.photoUrl, "JPEG", cols.photo.x+1, y+1, 11, 11); } catch (_) {
            try { doc.addImage(it.photoUrl, "PNG", cols.photo.x+1, y+1, 11, 11); } catch (__) {}
          }
        }
        doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(44, 24, 16);
        doc.text(String(i+1), cols.no.x+1, y+6);
        const compLines = doc.splitTextToSize(it.companyName || "-", cols.company.w - 2);
        doc.text(compLines[0] || "-", cols.company.x+1, y+5);
        if (compLines[1]) doc.text(compLines[1], cols.company.x+1, y+9);
        doc.text(it.tileSize || "-", cols.size.x+1, y+6);
        doc.text(it.ratePerSqft ? `Rs.${it.ratePerSqft}` : "-", cols.rate.x+1, y+6);
        doc.text(it.qtyPerBox || "-", cols.qty.x+1, y+6);
        doc.setFont("helvetica", "bold"); doc.setTextColor(139, 94, 60);
        doc.text(it.totalAmount ? `Rs.${parseFloat(it.totalAmount).toLocaleString("en-IN")}` : "-", cols.total.x+1, y+6);
        doc.setDrawColor(220, 190, 160); doc.setLineWidth(0.15); doc.line(ML, y+rowH, W-MR, y+rowH);
        y += rowH;
      }

      y += 4;
      const totW = 80, totX = W - MR - totW, totRowH = 7;
      const totRow = (label, value, bold, highlight) => {
        if (highlight) { doc.setFillColor(139, 94, 60); doc.rect(totX, y, totW, totRowH, "F"); doc.setTextColor(255,255,255); }
        else { doc.setFillColor(251, 239, 225); doc.rect(totX, y, totW, totRowH, "F"); doc.setTextColor(44,24,16); }
        doc.setFontSize(8); doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.text(label, totX+3, y+4.8); doc.text(value, W-MR-2, y+4.8, { align: "right" }); y += totRowH;
      };
      totRow("Subtotal", `Rs.${fmt(subtotal)}`);
      totRow("GRAND TOTAL", `Rs.${fmt(grandTotal)}`, true, true);

      y = H - 28;
      doc.setDrawColor(201, 149, 107); doc.setLineWidth(0.3); doc.line(ML, y, W-MR, y); y += 5;
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(139, 94, 60);
      doc.text("Note: This is a computer-generated quotation.", ML, y); y += 4;
      doc.setTextColor(74, 55, 40); doc.text("Prices valid for 7 days. Taxes as applicable.", ML, y); y += 6;
      doc.setFont("helvetica", "bold"); doc.setTextColor(44, 24, 16);
      doc.text(`Prepared By: ${q.createdBy || "—"}`, ML, y);
      doc.text(`Authorized: ${COMPANY_INFO.name}`, W-MR, y, { align: "right" });
      doc.save(`Tile_Quotation_${q.quotationNum}.pdf`);
    } catch (err) {
      alert("PDF error: " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F5EDE4", minHeight: "100vh" }}>
      {/* Navbar */}
      <div style={{
        background: "linear-gradient(135deg, #8B5E3C, #C9956B)",
        padding: sm ? "10px 12px" : "0 24px",
        minHeight: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)", flexWrap: "wrap", gap: 8
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={COMPANY_LOGO} alt="logo" style={{ height: sm ? 36 : 46, width: sm ? 36 : 46, objectFit: "contain", borderRadius: 10, border: "2px solid rgba(255,255,255,0.4)", background: "white", flexShrink: 0 }} />
          {!sm && <span style={{ color: "white", fontWeight: 700, fontSize: md ? 14 : 17 }}>JAI BALAJI BATH & TILE</span>}
        </div>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "6px 14px", color: "white", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>← Back</button>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: sm ? "16px 12px" : "28px 20px" }}>
        <h1 style={{ color: "#8B5E3C", margin: "0 0 24px", fontSize: sm ? 20 : 28, fontWeight: 700 }}>📜 Quotation History</h1>

        {/* Search & Filter */}
        <div style={{ background: "white", borderRadius: 16, padding: sm ? 14 : 24, border: "1.5px solid #E8D5C0", boxShadow: "0 2px 12px rgba(139,94,60,0.06)", marginBottom: 16 }}>
          <h3 style={{ color: "#4A3728", margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>🔍 Search & Filter</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 6 }}>Search by Quotation No. or Client Name</label>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #D5B99A", fontSize: 14, boxSizing: "border-box", color: "#2C1810" }} />
          </div>
          <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 6 }}>Filter By Date</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #D5B99A", fontSize: 14, boxSizing: "border-box", color: "#2C1810", background: "white" }}>
                <option value="all">All Quotations</option>
                <option value="today">Today</option>
                <option value="month">This Month</option>
                <option value="date">Select Date</option>
              </select>
            </div>
            {filterType === "date" && (
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 6 }}>Select Date</label>
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #D5B99A", fontSize: 14, boxSizing: "border-box", color: "#2C1810" }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 6 }}>&nbsp;</label>
              <button onClick={() => { setSearchTerm(""); setFilterType("all"); setFilterDate(""); }}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #C9956B", fontSize: 14, boxSizing: "border-box", color: "#8B5E3C", background: "white", fontWeight: 600, cursor: "pointer" }}>
                Clear Filters
              </button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#8B7355", fontWeight: 600 }}>
            Found <span style={{ color: "#8B5E3C", fontWeight: 700 }}>{filteredQuotations.length}</span> quotation{filteredQuotations.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Delete Actions */}
        {selectedForDelete.size > 0 && (
          <div style={{ background: "#FEE2E2", borderRadius: 12, padding: 16, marginBottom: 20, border: "1.5px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#991B1B", fontWeight: 600, fontSize: 14 }}>
              ⚠️ {selectedForDelete.size} quotation{selectedForDelete.size !== 1 ? "s" : ""} selected for deletion
            </div>
            <button onClick={() => setShowDeleteConfirm(true)} style={{
              background: "#DC2626", border: "none", borderRadius: 8, padding: "8px 16px",
              color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13
            }}>🗑 Delete Selected</button>
          </div>
        )}

        {/* Table */}
        <div style={{ background: "white", borderRadius: 16, padding: sm ? 14 : 24, border: "1.5px solid #E8D5C0", boxShadow: "0 2px 12px rgba(139,94,60,0.06)" }}>
          {filteredQuotations.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#8B7355", fontSize: 16 }}>
              {quotationList.length === 0 ? "No quotations saved yet. Create your first quotation!" : "No quotations match your search or filters."}
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: "#8B7355", fontWeight: 600 }}>Select All ({filteredQuotations.length})</span>
              </div>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: sm ? 11 : 13 }}>
                <thead>
                  <tr style={{ background: "#8B5E3C", color: "white" }}>
                    <th style={{ padding: sm ? "8px 6px" : "12px", textAlign: "center", fontWeight: 600, width: 40 }}>✓</th>
                    <th style={{ padding: sm ? "8px 6px" : "12px", textAlign: "left", fontWeight: 600 }}>Quot. No.</th>
                    <th style={{ padding: sm ? "8px 6px" : "12px", textAlign: "left", fontWeight: 600 }}>Date</th>
                    <th style={{ padding: sm ? "8px 6px" : "12px", textAlign: "left", fontWeight: 600 }}>Client</th>
                    <th style={{ padding: sm ? "8px 6px" : "12px", textAlign: "center", fontWeight: 600 }}>Items</th>
                    <th style={{ padding: sm ? "8px 6px" : "12px", textAlign: "right", fontWeight: 600 }}>Total</th>
                    <th style={{ padding: sm ? "8px 6px" : "12px", textAlign: "center", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map((q, idx) => {
                    const qId = q._id || q.id || q.quotationNum;
                    const isSelected = selectedForDelete.has(qId);
                    return (
                      <tr key={idx} style={{ background: isSelected ? "#FEE2E2" : (idx % 2 === 0 ? "#FBF5EF" : "white"), borderBottom: "1px solid #E8D5C0" }}>
                        <td style={{ padding: sm ? "8px 6px" : "12px", textAlign: "center" }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(qId)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                        </td>
                        <td style={{ padding: sm ? "8px 6px" : "12px", color: "#2C1810", fontWeight: 600, whiteSpace: "nowrap" }}>{q.quotationNum || "—"}</td>
                        <td style={{ padding: sm ? "8px 6px" : "12px", color: "#4A3728", whiteSpace: "nowrap" }}>
                          {q.date ? new Date(isoDate(q.date) + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td style={{ padding: sm ? "8px 6px" : "12px", color: "#4A3728" }}>{q.clientInfo?.name || q.clientName || "—"}</td>
                        <td style={{ padding: sm ? "8px 6px" : "12px", color: "#4A3728", textAlign: "center" }}>{q.items?.length ?? q.itemCount ?? "—"}</td>
                        <td style={{ padding: sm ? "8px 6px" : "12px", color: "#8B5E3C", fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>Rs.{q.grandTotal}</td>
                        <td style={{ padding: sm ? "8px 6px" : "12px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "nowrap" }}>
                            <button onClick={() => setSelectedQ(q)} style={{
                              background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6,
                              padding: sm ? "4px 8px" : "5px 10px", cursor: "pointer", color: "#1D4ED8", fontSize: sm ? 11 : 12, fontWeight: 600, whiteSpace: "nowrap"
                            }}>👁 View</button>
                            <button onClick={() => onEditQuotation && onEditQuotation(q)} style={{
                              background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 6,
                              padding: sm ? "4px 8px" : "5px 10px", cursor: "pointer", color: "#16A34A", fontSize: sm ? 11 : 12, fontWeight: 600, whiteSpace: "nowrap"
                            }}>✏ Edit</button>
                            <button onClick={() => downloadHistoryPDF(q)} disabled={pdfLoading} style={{
                              background: "linear-gradient(135deg, #8B5E3C, #C9956B)", border: "none", borderRadius: 6,
                              padding: sm ? "4px 8px" : "5px 10px", cursor: "pointer", color: "white", fontSize: sm ? 11 : 12, fontWeight: 600, whiteSpace: "nowrap"
                            }}>{pdfLoading ? "..." : "⬇ PDF"}</button>
                            <button onClick={() => {
                              setSelectedForDelete(new Set([qId]));
                              setShowDeleteConfirm(true);
                            }} style={{
                              background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 6,
                              padding: sm ? "4px 8px" : "5px 10px", cursor: "pointer", color: "#D32F2F", fontSize: sm ? 11 : 12, fontWeight: 600, whiteSpace: "nowrap"
                            }}>🗑 Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {filteredQuotations.length > 0 && (
          <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, background: "white", borderRadius: 12, padding: 16, border: "1.5px solid #E8D5C0", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#8B7355", marginBottom: 6 }}>Total Quotations</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#8B5E3C" }}>{filteredQuotations.length}</div>
            </div>
            <div style={{ flex: 1, minWidth: 200, background: "white", borderRadius: 12, padding: 16, border: "1.5px solid #E8D5C0", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#8B7355", marginBottom: 6 }}>Total Revenue</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#8B5E3C" }}>
                Rs.{filteredQuotations.reduce((sum, q) => {
                  const val = parseFloat((q.grandTotal || "0").toString().replace(/,/g, ""));
                  return sum + (isNaN(val) ? 0 : val);
                }, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2500,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => !deleteLoading && setShowDeleteConfirm(false)}>
          <div style={{
            background: "white", borderRadius: 16, width: "100%", maxWidth: 400,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ background: "#DC2626", padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Delete Quotations</div>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: "#4A3728", marginBottom: 16, lineHeight: 1.6 }}>
                You are about to permanently delete <strong>{selectedForDelete.size}</strong> quotation{selectedForDelete.size !== 1 ? "s" : ""} from the system. This action <strong>cannot be undone</strong>.
              </p>
              {deleteLoading && (
                <div style={{ background: "#FEE2E2", borderRadius: 8, padding: 12, marginBottom: 16, color: "#991B1B", fontSize: 13, fontWeight: 600 }}>
                  ⏳ Deleting... {deleteCount} / {selectedForDelete.size}
                </div>
              )}
              {deleteErrors.length > 0 && !deleteLoading && (
                <div style={{ background: "#FEE2E2", borderRadius: 8, padding: 12, marginBottom: 16, color: "#991B1B", fontSize: 12, fontWeight: 600 }}>
                  <div>❌ Errors:</div>
                  {deleteErrors.map((err, i) => <div key={i}>{err}</div>)}
                </div>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => !deleteLoading && setShowDeleteConfirm(false)} disabled={deleteLoading} style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #D5B99A",
                  background: "white", color: "#8B5E3C", fontWeight: 600, cursor: deleteLoading ? "not-allowed" : "pointer", opacity: deleteLoading ? 0.6 : 1
                }}>Cancel</button>
                <button onClick={handleDeleteQuotations} disabled={deleteLoading} style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "none",
                  background: "#DC2626", color: "white", fontWeight: 600, cursor: deleteLoading ? "not-allowed" : "pointer", opacity: deleteLoading ? 0.6 : 1
                }}>
                  {deleteLoading ? "🗑 Deleting..." : "🗑 Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selectedQ && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000,
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          overflowY: "auto", padding: sm ? "0" : "24px 16px"
        }} onClick={() => setSelectedQ(null)}>
          <div style={{
            background: "white", borderRadius: sm ? "16px 16px 0 0" : 20,
            width: "100%", maxWidth: 860,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative", overflow: "hidden",
            marginTop: sm ? "auto" : 0, alignSelf: sm ? "flex-end" : "flex-start"
          }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #8B5E3C, #C9956B)", padding: sm ? "14px 16px" : "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={COMPANY_LOGO} alt="logo" style={{ height: sm ? 34 : 44, width: sm ? 34 : 44, objectFit: "contain", borderRadius: 8, background: "white", flexShrink: 0 }} />
                <div>
                  <div style={{ color: "white", fontWeight: 800, fontSize: sm ? 13 : 16 }}>JAI BALAJI BATH & TILE</div>
                  <div style={{ color: "#FFE0C0", fontSize: 11 }}>Quotation Detail</div>
                </div>
              </div>
              <button onClick={() => setSelectedQ(null)} style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: 8, padding: "7px 12px", color: "white", cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0
              }}>✕</button>
            </div>

            <div style={{ padding: sm ? 16 : 28, maxHeight: sm ? "75vh" : "none", overflowY: sm ? "auto" : "visible" }}>
              {/* Quotation Meta */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  ["Quotation No.", selectedQ.quotationNum],
                  ["Date", selectedQ.date ? new Date(isoDate(selectedQ.date) + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"],
                  ["Valid Until", selectedQ.validUntil ? new Date(isoDate(selectedQ.validUntil) + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"],
                ].map(([l, v]) => (
                  <div key={l} style={{ flex: 1, minWidth: sm ? 120 : 160, background: "#FBF5EF", borderRadius: 10, padding: "8px 12px", border: "1px solid #E8D5C0" }}>
                    <div style={{ fontSize: 10, color: "#8B7355", marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: sm ? 11 : 13, fontWeight: 700, color: "#2C1810" }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Client Info */}
              <div style={{ background: "#FBF5EF", borderRadius: 12, padding: sm ? "12px" : "16px 20px", marginBottom: 16, border: "1px solid #E8D5C0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8B5E3C", marginBottom: 8 }}>👤 CLIENT INFORMATION</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[
                    ["Name", selectedQ.clientInfo?.name],
                    ["Address", selectedQ.clientInfo?.address],
                    ["Phone", selectedQ.clientInfo?.phone],
                    ["Email", selectedQ.clientInfo?.email],
                  ].map(([l, v]) => v ? (
                    <div key={l} style={{ minWidth: sm ? "45%" : "auto" }}>
                      <div style={{ fontSize: 10, color: "#8B7355" }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#2C1810" }}>{v}</div>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2C1810", marginBottom: 10 }}>🏗 ITEMIZED DETAILS</div>
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: sm ? 11 : 12 }}>
                    <thead>
                      <tr style={{ background: "#8B5E3C", color: "white" }}>
                        {["#", "Photo", "Company / Item", "Size", "Rate", "Qty", "Boxes", "Box Rate", "Total"].map(h => (
                          <th key={h} style={{ padding: "7px 8px", textAlign: "left", fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedQ.items || []).map((it, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#FBF5EF" : "white", borderBottom: "1px solid #E8D5C0" }}>
                          <td style={{ padding: "7px 8px", color: "#8B7355" }}>{i + 1}</td>
                          <td style={{ padding: "7px 8px" }}>
                            {it.photoUrl
                              ? <img src={it.photoUrl} alt="tile" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6, display: "block" }} />
                              : <div style={{ width: 34, height: 34, borderRadius: 6, background: "#E8D5C0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🪨</div>
                            }
                          </td>
                          <td style={{ padding: "7px 8px", fontWeight: 600, color: "#2C1810" }}>{it.companyName || "—"}</td>
                          <td style={{ padding: "7px 8px", color: "#4A3728", whiteSpace: "nowrap" }}>{it.tileSize || "—"}</td>
                          <td style={{ padding: "7px 8px", color: "#4A3728", whiteSpace: "nowrap" }}>{it.ratePerSqft ? `Rs.${it.ratePerSqft}` : "—"}</td>
                          <td style={{ padding: "7px 8px", color: "#4A3728" }}>{it.qtyPerBox || "—"}</td>
                          <td style={{ padding: "7px 8px", color: "#4A3728" }}>{it.numBoxes || "—"}</td>
                          <td style={{ padding: "7px 8px", color: "#4A3728", whiteSpace: "nowrap" }}>{it.perBoxRate ? `Rs.${it.perBoxRate}` : "—"}</td>
                          <td style={{ padding: "7px 8px", fontWeight: 700, color: "#8B5E3C", whiteSpace: "nowrap" }}>
                            {it.totalAmount ? `Rs.${parseFloat(it.totalAmount).toLocaleString("en-IN")}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: sm ? "100%" : 320, borderRadius: 12, overflow: "hidden", border: "1px solid #E8D5C0" }}>
                  {[
                    ["Subtotal", `Rs.${fmt(selectedQ.subtotal || 0)}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "#FBF0E6", borderBottom: "1px solid #E8D5C0" }}>
                      <span style={{ color: "#4A3728", fontSize: 13 }}>{l}</span>
                      <span style={{ color: "#2C1810", fontWeight: 600, fontSize: 13 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#8B5E3C" }}>
                    <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Grand Total</span>
                    <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Rs.{selectedQ.grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E8D5C0", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8B7355" }}>
                <div>Note: Computer-generated quotation. Prices valid for 7 days.</div>
                <div style={{ fontWeight: 700, color: "#2C1810" }}>Authorized: {COMPANY_INFO.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
function QuotationForm({ user, onLogout }) {
  const w = useWindowSize();
  const sm = w < 480;
  const md = w < 768;
  const [items, setItems] = useState([emptyItem()]);
  const [clientInfo, setClientInfo] = useState({ name: "", address: "", phone: "", email: "" });
  const [quotationNum] = useState(`TQ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
  const [dateValue, setDateValue] = useState(() => new Date().toISOString().split("T")[0]);
  const date = dateValue ? new Date(dateValue + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  const [validUntilDate, setValidUntilDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const validUntil = validUntilDate
    ? new Date(validUntilDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const [showPreview, setShowPreview] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [taxInput, setTaxInput] = useState("0");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentPwInput, setCurrentPwInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMsg, setResetMsg] = useState({ text: "", type: "" });
  const [quotationHistory, setQuotationHistory] = useState([]);

  useEffect(() => {
    loadQuotationsFromBackend();
  }, []);

  const loadQuotationsFromBackend = async () => {
    const data = await fetchQuotationsFromBackend();
    setQuotationHistory(data);
  };

  const updateItem = useCallback((idx, updated) => {
    setItems(prev => prev.map((it, i) => i === idx ? updated : it));
  }, []);

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.totalAmount) || 0), 0);
  const tax = subtotal * taxRate / 100;
  const grandTotal = subtotal + tax;
  const fmt = (n) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleTaxChange = (val) => {
    setTaxInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) setTaxRate(parsed);
  };

  const saveQuotationToHistory = async () => {
    const newQuotation = {
      quotationNum,
      date: dateValue,
      clientInfo,
      items,
      subtotal,
      taxRate,
      tax,
      grandTotal,
      validUntil: validUntilDate,
      createdBy: "Sumit Gupta"
    };

    const result = await saveQuotationToBackend(newQuotation);
    
    if (result.success) {
      setQuotationHistory(prev => [result.data, ...prev]);
      alert("Quotation saved successfully!");
    } else {
      alert("Error saving quotation: " + result.error);
    }
  };

  // ── PASSWORD RESET ───────────────────────────────────
  const saveNewPassword = () => {
    if (currentPwInput !== DEMO_USER.password) {
      setResetMsg({ text: "Current password is incorrect.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setResetMsg({ text: "New password must be at least 6 characters.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetMsg({ text: "Passwords do not match.", type: "error" });
      return;
    }
    DEMO_USER.password = newPassword;
    setResetMsg({ text: "✅ Password reset successfully!", type: "success" });
    setTimeout(() => {
      closeResetModal();
    }, 1500);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setCurrentPwInput(""); setNewPassword(""); setConfirmPassword("");
    setResetMsg({ text: "", type: "" });
  };

  // ── PDF GENERATION ───────────────────────────────────
  const generatePDF = async () => {
    setPdfLoading(true);
    try {
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const jsPDF = window.jspdf?.jsPDF;
      if (!jsPDF) { alert("PDF library failed to load."); return; }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297;
      const ML = 12, MR = 12;

      doc.setFillColor(201, 149, 107);
      doc.triangle(W, 0, W - 45, 0, W, 45, "F");
      doc.setFillColor(232, 200, 160);
      doc.triangle(W, 40, W - 28, 40, W, 68, "F");

      doc.setDrawColor(201, 149, 107);
      doc.setLineWidth(0.4);
      doc.rect(ML - 2, 10, W - ML - MR + 4, H - 20);

      let y = 16;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(139, 94, 60);
      doc.text("TILE QUOTATION", W / 2, y, { align: "center" });
      y += 7;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(74, 55, 40);
      doc.text(`Quotation No: ${quotationNum}     Date: ${date}     Valid Until: ${validUntil}`, W / 2, y, { align: "center" });
      y += 7;

      doc.setDrawColor(201, 149, 107);
      doc.setLineWidth(0.3);
      doc.line(ML, y, W - MR, y);
      y += 5;

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(139, 94, 60);
      doc.text("TO:", ML, y);
      y += 4;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(44, 24, 16);
      doc.setFontSize(9);
      doc.text(clientInfo.name || "Client Name", ML, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(74, 55, 40);

      const toLines = doc.splitTextToSize(clientInfo.address || "-", 88);
      for (let i = 0; i < toLines.length; i++) {
        if (toLines[i]) doc.text(toLines[i], ML, y);
        y += 3.8;
      }

      doc.text(`Ph: ${clientInfo.phone || "-"}`, ML, y);
      y += 3.8;
      if (clientInfo.email) doc.text(`Email: ${clientInfo.email}`, ML, y);
      y += 7;

      doc.line(ML, y, W - MR, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(44, 24, 16);
      doc.text("ITEMIZED QUOTATION DETAILS:", ML, y);
      y += 5;

      const usable = W - ML - MR;
      const cols = {
        no:      { x: ML,       w: 6  },
        photo:   { x: ML + 6,   w: 14 },
        company: { x: ML + 20,  w: 36 },
        size:    { x: ML + 56,  w: 24 },
        rate:    { x: ML + 80,  w: 20 },
        qty:     { x: ML + 100, w: 18 },
        total:   { x: ML + 118, w: 30 },
      };

      const headerH = 7;
      doc.setFillColor(139, 94, 60);
      doc.rect(ML, y, usable, headerH, "F");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);

      doc.text("#",              cols.no.x + 1,      y + 4.5);
      doc.text("Photo",         cols.photo.x + 1,   y + 4.5);
      doc.text("Company/Item",  cols.company.x + 1, y + 4.5);
      doc.text("Tile Size",     cols.size.x + 1,    y + 4.5);
      doc.text("Rate/sqft",     cols.rate.x + 1,    y + 4.5);
      doc.text("Qty/Box",       cols.qty.x + 1,     y + 4.5);
      doc.text("Total",         cols.total.x + 1,   y + 4.5);
      y += headerH;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const rowH = 13;

        if (i % 2 === 0) {
          doc.setFillColor(251, 245, 239);
          doc.rect(ML, y, usable, rowH, "F");
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(ML, y, usable, rowH, "F");
        }

        if (it.photoUrl) {
          try {
            doc.addImage(it.photoUrl, "JPEG", cols.photo.x + 1, y + 1, 11, 11);
          } catch (_) {
            try { doc.addImage(it.photoUrl, "PNG", cols.photo.x + 1, y + 1, 11, 11); } catch (__) {}
          }
        }

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(44, 24, 16);

        doc.text(String(i + 1), cols.no.x + 1, y + 6);

        const compLines = doc.splitTextToSize(it.companyName || "-", cols.company.w - 2);
        doc.text(compLines[0] || "-", cols.company.x + 1, y + 5);
        if (compLines[1]) doc.text(compLines[1], cols.company.x + 1, y + 9);

        doc.text(it.tileSize || "-", cols.size.x + 1, y + 6);
        doc.text(it.ratePerSqft ? `Rs.${it.ratePerSqft}` : "-", cols.rate.x + 1, y + 6);
        doc.text(it.qtyPerBox || "-", cols.qty.x + 1, y + 6);

        const totalVal = it.totalAmount ? `Rs.${parseFloat(it.totalAmount).toLocaleString("en-IN")}` : "-";
        doc.setFont("helvetica", "bold");
        doc.setTextColor(139, 94, 60);
        doc.text(totalVal, cols.total.x + 1, y + 6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(44, 24, 16);

        doc.setDrawColor(220, 190, 160);
        doc.setLineWidth(0.15);
        doc.line(ML, y + rowH, W - MR, y + rowH);
        y += rowH;
      }

      y += 4;
      const totW = 80;
      const totX = W - MR - totW;
      const totRowH = 7;

      const totRow = (label, value, bold = false, highlight = false) => {
        if (highlight) {
          doc.setFillColor(139, 94, 60);
          doc.rect(totX, y, totW, totRowH, "F");
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setFillColor(251, 239, 225);
          doc.rect(totX, y, totW, totRowH, "F");
          doc.setTextColor(44, 24, 16);
        }
        doc.setFontSize(8);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.text(label, totX + 3, y + 4.8);
        doc.text(value, W - MR - 2, y + 4.8, { align: "right" });
        y += totRowH;
      };

      totRow("Subtotal", `Rs.${fmt(subtotal)}`);
      totRow("GRAND TOTAL", `Rs.${fmt(grandTotal)}`, true, true);

      y = H - 28;
      doc.setDrawColor(201, 149, 107);
      doc.setLineWidth(0.3);
      doc.line(ML, y, W - MR, y);
      y += 5;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(139, 94, 60);
      doc.text("Note: This is a computer-generated quotation.", ML, y);
      y += 4;
      doc.setTextColor(74, 55, 40);
      doc.text("Prices valid for 7 days. Taxes as applicable.", ML, y);

      doc.save(`Tile_Quotation_${quotationNum}.pdf`);
      
      await saveQuotationToHistory();
    } catch (err) {
      alert("PDF generation error: " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const loadQuotationForEdit = (q) => {
    setClientInfo(q.clientInfo || { name: "", address: "", phone: "", email: "" });
    const editItems = (q.items && q.items.length > 0)
      ? q.items.map(it => ({
          id: Date.now() + Math.random(),
          photo: null,
          photoUrl: it.photoUrl || null,
          companyName: it.companyName || "",
          tileSize: it.tileSize || "",
          ratePerSqft: String(it.ratePerSqft || ""),
          qtyPerBox: String(it.qtyPerBox || ""),
          perBoxRate: String(it.perBoxRate || ""),
          numBoxes: String(it.numBoxes || ""),
          totalAmount: String(it.totalAmount || ""),
        }))
      : [emptyItem()];
    setItems(editItems);
    if (q.date) setDateValue(q.date.slice(0, 10));
    if (q.validUntil) setValidUntilDate(q.validUntil.slice(0, 10));
    setTaxRate(0);
    setTaxInput("0");
    setShowHistory(false);
    setShowPreview(false);
  };

  if (showHistory) {
    return <QuotationHistoryPage onBack={() => setShowHistory(false)} quotationList={quotationHistory} onQuotationDeleted={loadQuotationsFromBackend} onEditQuotation={loadQuotationForEdit} />;
  }

  if (showPreview) {
    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F5EDE4", minHeight: "100vh", padding: sm ? 12 : 24 }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          {/* Top bar */}
          <div style={{ display: "flex", flexDirection: sm ? "column" : "row", gap: 10, marginBottom: sm ? 14 : 24 }}>
            <button onClick={() => setShowPreview(false)} style={{
              background: "white", border: "1.5px solid #C9956B", borderRadius: 10,
              padding: "10px 18px", cursor: "pointer", color: "#4A3728", fontWeight: 600, fontSize: 14,
              flex: sm ? "none" : "0 0 auto"
            }}>← Back to Edit</button>
            <button onClick={generatePDF} disabled={pdfLoading} style={{
              background: "linear-gradient(135deg, #8B5E3C, #C9956B)", border: "none",
              borderRadius: 10, padding: "10px 24px", cursor: "pointer", color: "white",
              fontWeight: 700, fontSize: 14, flex: sm ? "none" : "0 0 auto", marginLeft: sm ? 0 : "auto"
            }}>
              {pdfLoading ? "⏳ Generating..." : "⬇ Download PDF"}
            </button>
          </div>

          {/* Quotation card */}
          <div style={{
            background: "white", borderRadius: 20, padding: sm ? "20px 14px" : md ? "28px 24px" : 40,
            boxShadow: "0 8px 32px rgba(139,94,60,0.12)", border: "1.5px solid #E8D5C0",
            position: "relative", overflow: "hidden"
          }}>
            {!sm && <div style={{
              position: "absolute", top: 0, right: 0, width: 110, height: 110,
              background: "linear-gradient(135deg, #C9956B 0%, #E8C9A0 100%)",
              clipPath: "polygon(100% 0, 0 0, 100% 100%)"
            }}/>}

            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: sm ? 18 : 26, fontWeight: 800, color: "#8B5E3C", letterSpacing: sm ? 1 : 2 }}>Quotation Tiles</div>
              <div style={{ fontSize: sm ? 11 : 13, fontWeight: 700, color: "#C9956B", marginTop: 3, letterSpacing: 1, textTransform: "uppercase" }}>Tile Quotation</div>
              <div style={{ color: "#4A3728", fontSize: sm ? 10 : 12, marginTop: 4, fontWeight: 600, lineHeight: 1.6 }}>
                {sm ? (
                  <>{quotationNum}<br />Date: {date} | Valid: {validUntil}</>
                ) : (
                  <>Quotation No: {quotationNum} &nbsp;|&nbsp; Date: {date} &nbsp;|&nbsp; Valid Until: {validUntil}</>
                )}
              </div>
            </div>

            <hr style={{ borderColor: "#C9956B", margin: "10px 0" }} />

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8B5E3C", marginBottom: 3 }}>TO:</div>
                <div style={{ fontWeight: 700, fontSize: sm ? 13 : 14, color: "#2C1810" }}>{clientInfo.name || "—"}</div>
                <div style={{ fontSize: sm ? 11 : 12, color: "#4A3728", lineHeight: 1.7 }}>
                  {clientInfo.address || "—"}<br />
                  Phone: {clientInfo.phone || "—"}<br />
                  {clientInfo.email && <>Email: {clientInfo.email}<br /></>}
                </div>
              </div>
            </div>

            <div style={{ fontWeight: 700, fontSize: sm ? 11 : 13, color: "#2C1810", marginBottom: 8 }}>ITEMIZED QUOTATION DETAILS:</div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: sm ? 11 : 12 }}>
                <thead>
                  <tr style={{ background: "#8B5E3C", color: "white" }}>
                    {["#", "Photo", "Company / Item", "Tile Size", "Rate/sqft", "Qty/Box", "Total (Rs.)"].map(h => (
                      <th key={h} style={{ padding: sm ? "6px 3px" : "8px 4px", textAlign: "left", fontSize: sm ? 10 : 11, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id} style={{ background: i % 2 === 0 ? "#FBF5EF" : "white" }}>
                      <td style={{ padding: sm ? "5px 3px" : "6px 4px", color: "#8B7355", fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: sm ? "5px 3px" : "6px 4px" }}>
                        {it.photoUrl && <img src={it.photoUrl} alt="tile" style={{ width: sm ? 32 : 44, height: sm ? 32 : 44, objectFit: "cover", borderRadius: 6, display: "block" }} />}
                      </td>
                      <td style={{ padding: sm ? "5px 3px" : "6px 4px", fontWeight: 600, color: "#2C1810" }}>{it.companyName || "—"}</td>
                      <td style={{ padding: sm ? "5px 3px" : "6px 4px", color: "#4A3728", whiteSpace: "nowrap" }}>{it.tileSize || "—"}</td>
                      <td style={{ padding: sm ? "5px 3px" : "6px 4px", color: "#4A3728", whiteSpace: "nowrap" }}>{it.ratePerSqft ? `Rs.${it.ratePerSqft}` : "—"}</td>
                      <td style={{ padding: sm ? "5px 3px" : "6px 4px", color: "#4A3728" }}>{it.qtyPerBox || "—"}</td>
                      <td style={{ padding: sm ? "5px 3px" : "6px 4px", fontWeight: 700, color: "#8B5E3C", whiteSpace: "nowrap" }}>
                        {it.totalAmount ? `Rs.${parseFloat(it.totalAmount).toLocaleString("en-IN")}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <div style={{ width: sm ? "100%" : 300, borderRadius: 10, overflow: "hidden", border: "1px solid #E8D5C0" }}>
                {[["Subtotal", `Rs.${fmt(subtotal)}`]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "#FBF0E6", borderBottom: "1px solid #E8D5C0" }}>
                    <span style={{ color: "#4A3728", fontSize: 13 }}>{l}</span>
                    <span style={{ color: "#2C1810", fontWeight: 600, fontSize: 13 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#8B5E3C" }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Grand Total</span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Rs.{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>

            <hr style={{ borderColor: "#C9956B", margin: "16px 0 10px" }} />
            <div style={{ fontSize: 11, color: "#8B7355" }}>
              Note: This is a computer-generated quotation. Prices valid for 7 days. Taxes as applicable.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F5EDE4", minHeight: "100vh" }}>
      {/* ── MAIN NAVBAR ── */}
      <div style={{
        background: "linear-gradient(135deg, #8B5E3C, #C9956B)",
        padding: sm ? "10px 12px" : "0 24px", minHeight: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)", flexWrap: "wrap", gap: 8
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={COMPANY_LOGO}
            alt="logo"
            style={{
              height: sm ? 36 : 46, width: sm ? 36 : 46, objectFit: "contain", borderRadius: 10,
              border: "2px solid rgba(255,255,255,0.4)", background: "white", flexShrink: 0
            }}
          />
          {!sm && <span style={{ color: "white", fontWeight: 700, fontSize: md ? 14 : 17 }}>JAI BALAJI BATH & TILE</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: sm ? 8 : 12, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowAdminDropdown(!showAdminDropdown)} style={{
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 8, padding: sm ? "5px 10px" : "6px 14px", color: "white", cursor: "pointer", fontSize: sm ? 12 : 13,
              display: "flex", alignItems: "center", gap: 4
            }}>
              ⚙️{!sm && " Admin"}
              <span style={{ fontSize: 10 }}>▼</span>
            </button>

            {showAdminDropdown && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 6,
                background: "white", borderRadius: 10, border: "1.5px solid #C9956B",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 1000,
                minWidth: 180, overflow: "hidden"
              }}>
                <button onClick={() => { setShowHistory(true); setShowAdminDropdown(false); }} style={{
                  width: "100%", padding: "12px 16px", border: "none",
                  background: "white", cursor: "pointer", textAlign: "left",
                  fontSize: 13, color: "#2C1810", fontWeight: 500
                }}
                onMouseEnter={(e) => e.target.style.background = "#FBF5EF"}
                onMouseLeave={(e) => e.target.style.background = "white"}
                >📜 Quotation History</button>
                <div style={{ borderTop: "1px solid #F0E0D0" }} />
                <button onClick={() => { setShowResetModal(true); setShowAdminDropdown(false); }} style={{
                  width: "100%", padding: "12px 16px", border: "none",
                  background: "white", cursor: "pointer", textAlign: "left",
                  fontSize: 13, color: "#2C1810", fontWeight: 500
                }}
                onMouseEnter={(e) => e.target.style.background = "#FBF5EF"}
                onMouseLeave={(e) => e.target.style.background = "white"}
                >🔑 Reset Password</button>
              </div>
            )}
          </div>

          {!sm && <span style={{ color: "#FFE5CC", fontSize: 13 }}>👤 {user}</span>}
          <button onClick={onLogout} style={{
            background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
            borderRadius: 8, padding: sm ? "5px 10px" : "6px 14px", color: "white", cursor: "pointer", fontSize: sm ? 12 : 13
          }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: sm ? "14px 10px" : md ? "20px 14px" : "28px 20px" }}>

        <div style={{
          background: "white", borderRadius: 16, padding: sm ? 14 : 24, marginBottom: 16,
          border: "1.5px solid #E8D5C0", boxShadow: "0 2px 12px rgba(139,94,60,0.06)"
        }}>
          <h2 style={{ color: "#8B5E3C", margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>📋 Quotation Details</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 5 }}>Quotation No.</label>
              <input value={quotationNum} readOnly style={{
                width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E8D5C0",
                fontSize: 14, boxSizing: "border-box", color: "#2C1810", background: "#FBF5EF", fontWeight: 600
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 5 }}>Date</label>
              <input
                type="date"
                value={dateValue}
                onChange={e => setDateValue(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #D5B99A",
                  fontSize: 14, boxSizing: "border-box", color: "#2C1810", background: "white", fontWeight: 600
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 5 }}>Valid Until</label>
              <input
                type="date"
                value={validUntilDate}
                onChange={e => setValidUntilDate(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #D5B99A",
                  fontSize: 14, boxSizing: "border-box", color: "#2C1810", background: "white", fontWeight: 600
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 5 }}>Prepared By</label>
              <input value="Sumit Gupta" readOnly style={{
                width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E8D5C0",
                fontSize: 14, boxSizing: "border-box", color: "#2C1810", background: "#FBF5EF", fontWeight: 600
              }} />
            </div>
          </div>

          <h3 style={{ color: "#4A3728", margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>👤 Client Information</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              ["name",    "Client / Company Name", "e.g. ABC Constructions", "text"],
              ["address", "Address",               "123 Main Street, City",  "text"],
              ["email",   "Email Address",         "client@example.com",     "email"],
            ].map(([f, l, p, t]) => (
              <div key={f} style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 5 }}>{l}</label>
                <input
                  type={t}
                  value={clientInfo[f]}
                  onChange={e => setClientInfo(ci => ({ ...ci, [f]: e.target.value }))}
                  placeholder={p}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #D5B99A",
                    fontSize: 14, boxSizing: "border-box", color: "#2C1810"
                  }}
                />
              </div>
            ))}
            {/* Phone with validation */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 5 }}>Phone</label>
              <input
                type="tel"
                value={clientInfo.phone}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9+\-\s]/g, "");
                  setClientInfo(ci => ({ ...ci, phone: val }));
                }}
                placeholder="+91 98765 43210"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: clientInfo.phone && clientInfo.phone.replace(/[^0-9]/g, "").length < 10
                    ? "1.5px solid #EF4444"
                    : "1.5px solid #D5B99A",
                  fontSize: 14, boxSizing: "border-box", color: "#2C1810"
                }}
              />
              {clientInfo.phone && clientInfo.phone.replace(/[^0-9]/g, "").length < 10 && (
                <div style={{ color: "#EF4444", fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                  ⚠ Invalid phone number — minimum 10 digits required
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ color: "#8B5E3C", margin: 0, fontSize: 17, fontWeight: 700 }}>🏗 Tile Items</h2>
            <span style={{
              background: "#8B5E3C", color: "white", borderRadius: 20,
              padding: "3px 12px", fontSize: 13, fontWeight: 600
            }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} style={{ position: "relative" }}>
              <ItemForm item={item} index={idx} onChange={u => updateItem(idx, u)} />
              {items.length > 1 && (
                <button onClick={() => removeItem(idx)} style={{
                  position: "absolute", top: 18, right: 18, background: "#FEE2E2",
                  border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                  color: "#991B1B", fontSize: 12, fontWeight: 600
                }}>✕ Remove</button>
              )}
            </div>
          ))}
        </div>

        <div style={{
          background: "white", borderRadius: 16, padding: sm ? 14 : 20, marginBottom: 16,
          border: "1.5px solid #E8D5C0"
        }}>
          <h3 style={{ color: "#4A3728", margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>Summary</h3>
          <div style={{ display: "flex", gap: sm ? 8 : 12, flexWrap: sm ? "nowrap" : "wrap" }}>
            {[["Subtotal", `Rs.${fmt(subtotal)}`], ["Grand Total", `Rs.${fmt(grandTotal)}`]].map(([l, v], i) => (
              <div key={l} style={{
                flex: 1, padding: sm ? 10 : 14, borderRadius: 12, textAlign: "center",
                background: i === 2 ? "#8B5E3C" : "#FBF5EF",
                border: i === 2 ? "none" : "1px solid #E8D5C0"
              }}>
                <div style={{ fontSize: sm ? 9 : 11, color: i === 2 ? "#FFD9B3" : "#8B7355", marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: sm ? 13 : 18, fontWeight: 700, color: i === 2 ? "white" : "#2C1810" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={addItem} style={{
            background: "white", border: "2px solid #C9956B", borderRadius: 12,
            padding: sm ? "12px 20px" : "14px 28px", cursor: "pointer", color: "#8B5E3C",
            fontWeight: 700, fontSize: sm ? 14 : 15, width: sm ? "100%" : "auto"
          }}>➕ Add More Items</button>
          <button onClick={() => setShowPreview(true)} style={{
            background: "linear-gradient(135deg, #8B5E3C, #C9956B)", border: "none",
            borderRadius: 12, padding: sm ? "12px 20px" : "14px 32px", cursor: "pointer", color: "white",
            fontWeight: 700, fontSize: sm ? 14 : 15, boxShadow: "0 4px 16px rgba(139,94,60,0.3)",
            width: sm ? "100%" : "auto"
          }}>📄 Preview & Generate Quotation</button>
        </div>
      </div>

      {/* ── PASSWORD RESET MODAL ── */}
      {showResetModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 3000,
          display: "flex", alignItems: sm ? "flex-end" : "center", justifyContent: "center",
          padding: sm ? 0 : 16
        }} onClick={closeResetModal}>
          <div style={{
            background: "white", borderRadius: sm ? "16px 16px 0 0" : 20,
            width: "100%", maxWidth: sm ? "100%" : 420,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #8B5E3C, #C9956B)", padding: sm ? "14px 16px" : "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🔑</span>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Reset Password</div>
              </div>
              <button onClick={closeResetModal} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "4px 10px", color: "white", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ padding: sm ? 16 : 28 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 6 }}>Current Password</label>
                <input
                  type="password"
                  value={currentPwInput}
                  onChange={e => setCurrentPwInput(e.target.value)}
                  placeholder="Enter current password"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #D5B99A", fontSize: 14, boxSizing: "border-box", color: "#2C1810" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 6 }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #D5B99A", fontSize: 14, boxSizing: "border-box", color: "#2C1810" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4A3728", display: "block", marginBottom: 6 }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box", color: "#2C1810",
                    border: confirmPassword && confirmPassword !== newPassword ? "1.5px solid #EF4444" : "1.5px solid #D5B99A"
                  }}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <div style={{ color: "#EF4444", fontSize: 11, marginTop: 4, fontWeight: 600 }}>⚠ Passwords do not match</div>
                )}
              </div>

              <button onClick={saveNewPassword} style={{
                background: "linear-gradient(135deg, #8B5E3C, #C9956B)", border: "none",
                borderRadius: 10, padding: "13px", color: "white", fontWeight: 700,
                fontSize: 15, cursor: "pointer", width: "100%"
              }}>Reset Password</button>

              {resetMsg.text && (
                <div style={{
                  marginTop: 16, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: resetMsg.type === "error" ? "#FEE2E2" : "#DCFCE7",
                  color: resetMsg.type === "error" ? "#991B1B" : "#166534",
                  border: `1px solid ${resetMsg.type === "error" ? "#FECACA" : "#BBF7D0"}`
                }}>{resetMsg.text}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <LoginScreen onLogin={setUser} />;
  return <QuotationForm user={user} onLogout={() => setUser(null)} />;
}