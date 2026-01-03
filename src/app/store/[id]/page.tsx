"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, User, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Product {
    _id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    createdAt: string;
    sellerId: {
        name: string;
        email: string;
        image?: string;
    };
}

export default function ProductDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession(); // Used if we add "Buy" or "Chat" later
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/store/${id}`); // We need to implement this API route
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/store" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back to Store
                </Link>

                <div className="glass-card rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
                    <div className="bg-muted/30 h-[400px] md:h-auto relative flex items-center justify-center">
                        {product.image ? (
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                            <ShoppingBag className="w-24 h-24 text-muted-foreground/30" />
                        )}
                    </div>

                    <div className="p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
                                        <Tag size={14} /> {product.category}
                                    </span>
                                </div>
                                <div className="text-3xl font-bold text-primary">
                                    ₹{product.price}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <h3 className="text-lg font-semibold">Description</h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {product.description}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-border">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">Seller Information</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                    {product.sellerId?.name?.[0]}
                                </div>
                                <div>
                                    <p className="font-semibold">{product.sellerId?.name}</p>
                                    <p className="text-sm text-muted-foreground">{product.sellerId?.email}</p>
                                </div>
                            </div>

                            <button className="w-full mt-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25">
                                Contact Seller
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
