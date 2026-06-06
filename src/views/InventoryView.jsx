// InventoryView.jsx
import React, { useState, useEffect } from 'react';
import { 
  getDb, saveDb, getInventory, logInventoryTransaction, saveInventoryItem 
} from '../db/mockDb';
import Modal from '../components/Modal';
import { 
  Package, Plus, AlertTriangle, ArrowUpRight, ArrowDownLeft, 
  Warehouse, Clipboard, Truck, FileText, ShoppingCart
} from 'lucide-react';

export default function InventoryView({ userRole }) {
  const [db, setDb] = useState(getDb());
  const [inventory, setInventory] = useState(getInventory());
  const [activeTab, setActiveTab] = useState('stock');
  
  // Modals state
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);

  // Transaction form fields
  const [trans, setTrans] = useState({
    itemId: '',
    type: 'Stock In',
    qty: '',
    warehouse: 'Kochi Main',
    notes: ''
  });

  // New item form fields
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Solar Panels',
    qty: 0,
    unit: 'Nos',
    minStock: 20,
    warehouse: 'Kochi Main',
    price: ''
  });

  // Purchase Order form fields
  const [newPO, setNewPO] = useState({
    supplierName: 'Waaree Solar India Ltd',
    itemName: 'Waaree 550W Panels',
    qty: 50,
    unitCost: 15890
  });

  useEffect(() => {
    setDb(getDb());
    setInventory(getInventory());
  }, []);

  const refreshInventory = () => {
    const fresh = getDb();
    setDb(fresh);
    setInventory(fresh.inventory);
  };

  const handleStockTransaction = (e) => {
    e.preventDefault();
    logInventoryTransaction({
      itemId: trans.itemId,
      type: trans.type,
      qty: parseInt(trans.qty),
      warehouse: trans.warehouse,
      notes: trans.notes
    });

    setIsStockAdjustOpen(false);
    setTrans({ itemId: '', type: 'Stock In', qty: '', warehouse: 'Kochi Main', notes: '' });
    refreshInventory();
    alert('Stock adjusted successfully!');
  };

  const handleCreateItem = (e) => {
    e.preventDefault();
    const itemId = 'I0' + (inventory.length + 101);
    const itemData = {
      ...newItem,
      id: itemId,
      qty: parseInt(newItem.qty),
      minStock: parseInt(newItem.minStock),
      price: parseFloat(newItem.price)
    };

    saveInventoryItem(itemData);
    setIsNewItemOpen(false);
    setNewItem({ name: '', category: 'Solar Panels', qty: 0, unit: 'Nos', minStock: 20, warehouse: 'Kochi Main', price: '' });
    refreshInventory();
    alert(`New item registered: ${itemData.name}`);
  };

  const handleCreatePO = (e) => {
    e.preventDefault();
    const poId = 'PO-2026-0' + (db.purchases.length + 1);
    const cost = parseInt(newPO.qty) * parseFloat(newPO.unitCost);

    db.purchases.push({
      id: poId,
      supplierName: newPO.supplierName,
      materials: [{ itemId: 'I001', name: newPO.itemName, qty: parseInt(newPO.qty), unitCost: parseFloat(newPO.unitCost) }],
      totalCost: cost,
      deliveryStatus: 'Pending',
      grnStatus: 'Awaiting Dispatch',
      createdAt: new Date().toISOString().split('T')[0]
    });

    saveDb(db);
    setIsNewPOOpen(false);
    refreshInventory();
    alert(`Purchase Order ${poId} generated successfully!`);
  };

  const handleCompleteGRN = (poId) => {
    const updated = { ...db };
    const poIdx = updated.purchases.findIndex(p => p.id === poId);
    if (poIdx !== -1) {
      updated.purchases[poIdx].deliveryStatus = 'Delivered';
      updated.purchases[poIdx].grnStatus = 'Completed';

      // Automatically add stock to inventory
      const mat = updated.purchases[poIdx].materials[0];
      const invItem = updated.inventory.find(i => i.id === mat.itemId || i.name.toLowerCase().includes(mat.name.toLowerCase().substring(0, 10)));
      if (invItem) {
        invItem.qty = Number(invItem.qty) + Number(mat.qty);
      }

      // Add financial log for payable
      updated.finance.push({
        id: 'F' + (updated.finance.length + 101),
        description: `Supplier payment PO complete: ${updated.purchases[poIdx].supplierName}`,
        type: 'Payable (Out)',
        amount: updated.purchases[poIdx].totalCost,
        projectSize: 0,
        date: new Date().toISOString().split('T')[0],
        gst: Math.round(updated.purchases[poIdx].totalCost * 0.18),
        zohoSynced: false
      });

      saveDb(updated);
      refreshInventory();
      alert(`Goods Receipt Note (GRN) filed. Stock updated.`);
    }
  };

  return (
    <div className="inventory-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><Package className="view-icon-color" /> Inventory & Stock</h2>
          <p className="view-subtitle">Monitor solar module warehouses, low stock thresholds, supplier database directories, and goods receipts.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setIsStockAdjustOpen(true)}>
            <ArrowUpRight size={14} /> Adjust Stock
          </button>
          <button className="btn btn-primary" onClick={() => setIsNewItemOpen(true)}>
            <Plus size={14} /> Add Stock Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <button className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
          <Warehouse size={14} style={{ display: 'inline', marginRight: '6px' }} /> Stock Registry
        </button>
        <button className={`tab-btn ${activeTab === 'po' ? 'active' : ''}`} onClick={() => setActiveTab('po')}>
          <ShoppingCart size={14} style={{ display: 'inline', marginRight: '6px' }} /> Purchase Orders
        </button>
        <button className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>
          <Truck size={14} style={{ display: 'inline', marginRight: '6px' }} /> Suppliers
        </button>
      </div>

      {/* ---------------- STOCK TAB ---------------- */}
      {activeTab === 'stock' && (
        <div>
          {/* Low Stock Alerts Banner */}
          {inventory.some(i => i.qty <= i.minStock) && (
            <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle className="text-danger" size={18} style={{ color: 'var(--status-danger)' }} />
              <div style={{ fontSize: '13px' }}>
                <strong>Critical Low Stock Warning:</strong> Certain items (including Inverters / Solar Panels) have fallen below safety limits. Please trigger Reorder POs.
              </div>
            </div>
          )}

          <div className="glass-card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Available Warehouse Materials</h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Material Name</th>
                    <th>Category</th>
                    <th>Warehouse Room</th>
                    <th>Available Qty</th>
                    <th>Min Safety Limit</th>
                    <th>Status Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const isLow = item.qty <= item.minStock;
                    return (
                      <tr key={item.id}>
                        <td><code>{item.id}</code></td>
                        <td style={{ fontWeight: '600' }}>{item.name}</td>
                        <td>{item.category}</td>
                        <td>{item.warehouse}</td>
                        <td><strong>{item.qty} {item.unit}</strong></td>
                        <td>{item.minStock} {item.unit}</td>
                        <td>
                          <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                            {isLow ? 'REORDER NOW' : 'IN STOCK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PO TAB ---------------- */}
      {activeTab === 'po' && (
        <div className="po-management-pane">
          <div className="glass-card">
            <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title">Procurement requests & orders</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setIsNewPOOpen(true)}>
                <Plus size={12} /> Raise Purchase Order
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>PO Ref</th>
                    <th>Vendor Supplier</th>
                    <th>Ordered Materials</th>
                    <th>Cost Value</th>
                    <th>Delivery Track</th>
                    <th>GRN Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {db.purchases.map(po => (
                    <tr key={po.id}>
                      <td><code>{po.id}</code></td>
                      <td style={{ fontWeight: '600' }}>{po.supplierName}</td>
                      <td>
                        {po.materials.map((m, idx) => (
                          <div key={idx} style={{ fontSize: '12px' }}>{m.name} (Qty: {m.qty})</div>
                        ))}
                      </td>
                      <td>₹{po.totalCost.toLocaleString('en-IN')}</td>
                      <td>{po.deliveryStatus}</td>
                      <td>
                        <span className={`badge ${po.grnStatus === 'Completed' ? 'badge-success' : 'badge-pending'}`}>
                          {po.grnStatus}
                        </span>
                      </td>
                      <td>
                        {po.grnStatus !== 'Completed' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => handleCompleteGRN(po.id)}>
                            <Truck size={12} /> File GRN Receipt
                          </button>
                        ) : (
                          <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold' }}>✓ Received</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SUPPLIERS TAB ---------------- */}
      {activeTab === 'suppliers' && (
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Active Vendor Registry</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Supplier Name</th>
                  <th>GST Number</th>
                  <th>Contact Email</th>
                  <th>Payment Terms</th>
                  <th>Supplier Rating</th>
                </tr>
              </thead>
              <tbody>
                {db.suppliers.map(sup => (
                  <tr key={sup.id}>
                    <td><code>{sup.id}</code></td>
                    <td style={{ fontWeight: '600' }}>{sup.name}</td>
                    <td><code>{sup.gst}</code></td>
                    <td>{sup.contact}</td>
                    <td>{sup.terms}</td>
                    <td style={{ color: 'var(--status-pending)', fontWeight: 'bold' }}>★ {sup.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal isOpen={isStockAdjustOpen} onClose={() => setIsStockAdjustOpen(false)} title="Warehouse Stock Adjustment">
        <form onSubmit={handleStockTransaction}>
          <div className="form-group">
            <label>Select Material Item *</label>
            <select 
              required
              className="form-control"
              value={trans.itemId}
              onChange={(e) => setTrans({ ...trans, itemId: e.target.value })}
            >
              <option value="">-- Choose Item --</option>
              {inventory.map(i => (
                <option key={i.id} value={i.id}>{i.name} (Available: {i.qty} {i.unit})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Adjustment Type</label>
              <select 
                className="form-control"
                value={trans.type}
                onChange={(e) => setTrans({ ...trans, type: e.target.value })}
              >
                <option value="Stock In">Stock In (Procurement/Correction)</option>
                <option value="Stock Out">Stock Out (Installation/Loss)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={trans.qty}
                onChange={(e) => setTrans({ ...trans, qty: e.target.value })}
                placeholder="E.g., 10"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Warehouse Location</label>
            <select 
              className="form-control"
              value={trans.warehouse}
              onChange={(e) => setTrans({ ...trans, warehouse: e.target.value })}
            >
              <option value="Kochi Main">Kochi Main</option>
              <option value="Calicut Sub">Calicut Sub</option>
            </select>
          </div>

          <div className="form-group">
            <label>Transaction Notes / References</label>
            <textarea 
              rows={2}
              className="form-control"
              value={trans.notes}
              onChange={(e) => setTrans({ ...trans, notes: e.target.value })}
              placeholder="E.g., Stock out for Project george Joseph"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStockAdjustOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Item Modal */}
      <Modal isOpen={isNewItemOpen} onClose={() => setIsNewItemOpen(false)} title="Register New Stock Material">
        <form onSubmit={handleCreateItem}>
          <div className="form-group">
            <label>Material Name *</label>
            <input 
              type="text" 
              required 
              className="form-control"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="E.g., Polycab DC Solar Cable 6sqmm"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Material Category</label>
              <select 
                className="form-control"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                <option value="Solar Panels">Solar Panels</option>
                <option value="Inverters">Inverters</option>
                <option value="Structure Materials">Structure Materials</option>
                <option value="Cables">Cables</option>
                <option value="ACDB">ACDB</option>
                <option value="DCDB">DCDB</option>
                <option value="BOS Materials">BOS Materials</option>
              </select>
            </div>
            <div className="form-group">
              <label>Standard Unit</label>
              <select 
                className="form-control"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              >
                <option value="Nos">Nos</option>
                <option value="Meters">Meters</option>
                <option value="Kgs">Kgs</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Initial Quantity *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={newItem.qty}
                onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Reorder Safety Limit *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={newItem.minStock}
                onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Warehouse Room</label>
              <select 
                className="form-control"
                value={newItem.warehouse}
                onChange={(e) => setNewItem({ ...newItem, warehouse: e.target.value })}
              >
                <option value="Kochi Main">Kochi Main</option>
                <option value="Calicut Sub">Calicut Sub</option>
              </select>
            </div>
            <div className="form-group">
              <label>Estimated Item Price (INR) *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewItemOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Item
            </button>
          </div>
        </form>
      </Modal>

      {/* New PO Modal */}
      <Modal isOpen={isNewPOOpen} onClose={() => setIsNewPOOpen(false)} title="Raise Purchase Order (PO)">
        <form onSubmit={handleCreatePO}>
          <div className="form-group">
            <label>Select Vendor Supplier *</label>
            <select 
              className="form-control"
              value={newPO.supplierName}
              onChange={(e) => setNewPO({ ...newPO, supplierName: e.target.value })}
            >
              {db.suppliers.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Item Description *</label>
            <input 
              type="text" 
              required
              className="form-control"
              value={newPO.itemName}
              onChange={(e) => setNewPO({ ...newPO, itemName: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Order Qty *</label>
              <input 
                type="number" 
                required
                className="form-control"
                value={newPO.qty}
                onChange={(e) => setNewPO({ ...newPO, qty: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Unit Price Cost (INR) *</label>
              <input 
                type="number" 
                required
                className="form-control"
                value={newPO.unitCost}
                onChange={(e) => setNewPO({ ...newPO, unitCost: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewPOOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate PO Document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
