"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Plus } from "lucide-react";

interface Product {
    _id: string;
    title: string;
    price: number;
    category: string;
    image?: string;
    sellerId: {
        name: string;
        image?: string;
    };
}

export default function StorePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/store");
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === "All" || p.category === category;
        return matchesSearch && matchesCategory;
    });

    const categories = ["All", "Textbooks", "Electronics", "Furniture", "Clothing", "Other"];

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-2">
                            <ShoppingBag className="text-blue-400" /> Surplus Store
                        </h1>
                        <p className="text-muted-foreground mt-1">Buy and sell campus essentials.</p>
                    </div>
                    <Link
                        href="/store/new"
                        className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
                    >
                        <Plus size={18} /> Sell Item
                    </Link>
                </div>

                {/* Search & Filter */}
                <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-muted-foreground h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-foreground focus:ring-1 focus:ring-primary outline-none placeholder:text-muted-foreground"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${category === cat
                                        ? "bg-primary/20 text-primary border border-primary/20"
                                        : "bg-background/50 hover:bg-background/80 border border-border text-muted-foreground"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground glass-card rounded-2xl">
                        <p>No items found.</p>
                        <Link href="/store/new" className="text-primary hover:underline mt-2 inline-block">List an item for sale</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <div key={product._id} className="glass-card rounded-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                                {/* Image Placeholder */}
                                <div className="h-48 bg-muted/50 relative overflow-hidden flex items-center justify-center">
                                    {product.image ? (
                                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                                    )}
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white font-medium">
                                        ${product.price}
                                    </div>
                                </div>

                                <div className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-foreground line-clamp-1">{product.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{product.category}</p>

                                    <div className="pt-2 flex items-center gap-2 border-t border-border/50">
                                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                            {product.sellerId?.name?.[0] || "?"}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{product.sellerId?.name || "Unknown Seller"}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
