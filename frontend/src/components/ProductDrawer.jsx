import { useState, useEffect } from 'react';
import { X, Save, Upload, Package } from 'lucide-react';
import Drawer from './Drawer';
import { inventoryAPI } from '../services/api';
import '../styles/components/Drawer.css'; // Reusing Drawer styles

const STOCK_STATUS_OPTIONS = [
    { value: 'IN_STOCK', label: 'In Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' }
];

function ProductDrawer({ isOpen, onClose, checkProduct, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        price: '',
        stock_level: '',
        image_url: '',
        status: 'IN_STOCK'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (checkProduct) {
                setFormData({
                    name: checkProduct.name || '',
                    sku: checkProduct.sku || '',
                    category: checkProduct.category || '',
                    price: checkProduct.price || '',
                    stock_level: checkProduct.stock_level || '',
                    image_url: checkProduct.image_url || '',
                    status: checkProduct.status || 'IN_STOCK'
                });
            } else {
                // Reset form for new product
                setFormData({
                    name: '',
                    sku: '',
                    category: '',
                    price: '',
                    stock_level: '',
                    image_url: '',
                    status: 'IN_STOCK'
                });
            }
            setError(null);
        }
    }, [isOpen, checkProduct]);

    const fetchCategories = async () => {
        try {
            const data = await inventoryAPI.getCategories();
            setCategories(data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate required fields
            if (!formData.name || !formData.sku || !formData.price) {
                throw new Error('Name, SKU, and Price are required');
            }

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                stock_level: parseInt(formData.stock_level) || 0
            };

            let savedProduct;
            if (checkProduct) {
                savedProduct = await inventoryAPI.update(checkProduct.id, payload);
            } else {
                savedProduct = await inventoryAPI.create(payload);
            }

            onSave(savedProduct);
            onClose();
        } catch (err) {
            console.error('Failed to save product:', err);
            setError(err.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={checkProduct ? 'Edit Product' : 'Add New Product'}
            width="500px"
            actions={
                <>
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (checkProduct ? 'Update Product' : 'Create Product')}
                    </button>
                </>
            }
        >
            <div className="drawer-content-scroll">
                {error && (
                    <div className="error-message" style={{
                        padding: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-accent-red)',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group full-width">
                        <label>Product Name <span className="required">*</span></label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Premium Cotton T-Shirt"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>SKU <span className="required">*</span></label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            placeholder="e.g. TSH-001-BLK"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder="e.g. Apparel"
                            list="categories-list"
                            className="form-input"
                        />
                        <datalist id="categories-list">
                            {categories.map(cat => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>

                    <div className="form-group">
                        <label>Price ($) <span className="required">*</span></label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Stock Level</label>
                        <input
                            type="number"
                            name="stock_level"
                            value={formData.stock_level}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="form-select"
                        >
                            {STOCK_STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group full-width">
                        <label>Image URL</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="form-input"
                                style={{ flex: 1 }}
                            />
                            {formData.image_url && (
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </Drawer>
    );
}

export default ProductDrawer;
