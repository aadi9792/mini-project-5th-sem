'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Coins, Star, ShoppingBag, Shirt, Sparkles } from 'lucide-react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeAmbience } from '@/components/ThemeAmbience';
import { economyClient } from '@/lib/economy/economyClient';

interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  price: number;
  category: string;
  isOwned: boolean;
  isEquipped: boolean;
}

interface ShopData {
  coins: number;
  stars: number;
  avatarBaseFace: string;
  items: ShopItem[];
}

const AVATAR_FACES = ['😀','😎','🤩','😄','🥳','😊','🌟','🦸','🧙','🐱','🦊','🐸','🦄','🐺','🐧'];

const CATEGORY_ICONS: Record<string, string> = {
  HAT: '🎩',
  SHIRT: '👕',
  ACCESSORY: '✨',
  BACKGROUND: '🖼️',
  PET: '🐾',
  OTHER: '🎁',
};

export default function ShopPage() {
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [buying, setBuying] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [facePickerOpen, setFacePickerOpen] = useState(false);
  const [selectedFace, setSelectedFace] = useState<string>('😀');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadShop = useCallback(async () => {
    try {
      setLoading(true);
      const res = await economyClient.getShop();
      setData(res);
      setSelectedFace(res.avatarBaseFace || '😀');
    } catch (e: any) {
      setError(e.message || 'Could not load shop');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadShop(); }, [loadShop]);

  const handleBuy = async (itemId: string, price: number) => {
    if (!data) return;
    if (data.coins < price) { showToast('Not enough coins! 🪙', 'error'); return; }
    setBuying(itemId);
    try {
      await economyClient.buyItem(itemId);
      showToast('Item purchased! 🎉');
      loadShop();
    } catch (e: any) {
      showToast(e.message || 'Purchase failed', 'error');
    } finally {
      setBuying(null);
    }
  };

  const handleEquip = async (itemId: string, isEquipped: boolean) => {
    setEquipping(itemId);
    try {
      if (isEquipped) {
        await economyClient.unequipItem(itemId);
        showToast('Item unequipped');
      } else {
        await economyClient.equipItem(itemId);
        showToast('Item equipped! ✨');
      }
      loadShop();
    } catch (e: any) {
      showToast(e.message || 'Could not equip item', 'error');
    } finally {
      setEquipping(null);
    }
  };

  const handleSetFace = async (face: string) => {
    try {
      await economyClient.setAvatarFace(face);
      setSelectedFace(face);
      setFacePickerOpen(false);
      showToast('Avatar updated! 🌟');
      loadShop();
    } catch (e: any) {
      showToast(e.message || 'Could not update avatar', 'error');
    }
  };

  const categories = data
    ? ['ALL', ...Array.from(new Set(data.items.map(i => i.category)))]
    : ['ALL'];

  const filtered = data
    ? (activeCategory === 'ALL' ? data.items : data.items.filter(i => i.category === activeCategory))
    : [];

  return (
    <ThemeProvider>
      <ThemeAmbience />
      <div className="min-h-screen bg-[var(--sv-bg)] text-[var(--sv-text)] font-body">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-bold text-sm animate-card-enter ${
              toast.type === 'success' ? 'bg-[var(--sv-primary)]' : 'bg-red-500'
            }`}
            role="alert"
            aria-live="polite"
          >
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-30 bg-[var(--sv-bg)]/90 backdrop-blur-sm border-b border-[var(--sv-primary)]/10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/hub" className="p-2 rounded-xl hover:bg-[var(--sv-card-tint)] transition text-[var(--sv-text-soft)] hover:text-[var(--sv-text)]">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-[var(--sv-primary)]" />
                <h1 className="font-heading font-bold text-2xl text-[var(--sv-text)]">Avatar Shop</h1>
              </div>
            </div>
            {data && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-[var(--sv-card)] px-3 py-1.5 rounded-full border border-[var(--sv-primary)]/20">
                  <Star className="w-4 h-4 text-[var(--sv-warning)]" />
                  <span className="font-bold text-sm">{data.stars.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--sv-card)] px-3 py-1.5 rounded-full border border-[var(--sv-primary)]/20">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-sm">{data.coins.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 rounded-full border-4 border-[var(--sv-primary)]/30 border-t-[var(--sv-primary)] animate-spin" />
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center text-red-600">
              <p className="font-bold text-lg">Could not load shop</p>
              <p className="text-sm mt-1">{error}</p>
              <button onClick={loadShop} className="mt-4 px-6 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition">
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Avatar Preview Card */}
              <section className="mb-8 bg-[var(--sv-card)] rounded-3xl p-6 border border-[var(--sv-primary)]/20 shadow-sm">
                <div className="flex items-center gap-6">
                  {/* Big avatar display */}
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--sv-primary)]/20 to-[var(--sv-secondary)]/20 flex items-center justify-center text-6xl border-4 border-[var(--sv-primary)]/30 shadow-lg">
                      {selectedFace}
                    </div>
                    {/* Equipped items badges */}
                    {data.items.filter(i => i.isEquipped).map((item, idx) => (
                      <span
                        key={item.id}
                        className="absolute text-2xl"
                        style={{ top: idx * 24 - 10, right: -10 }}
                        title={item.name}
                      >
                        {item.emoji}
                      </span>
                    ))}
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-[var(--sv-text)] mb-1">Your Avatar</h2>
                    <p className="text-sm text-[var(--sv-text-soft)] mb-4">
                      {data.items.filter(i => i.isEquipped).length > 0
                        ? `Wearing: ${data.items.filter(i => i.isEquipped).map(i => i.name).join(', ')}`
                        : 'No items equipped yet — visit the shop below!'}
                    </p>
                    <button
                      onClick={() => setFacePickerOpen(!facePickerOpen)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--sv-primary)] text-white font-bold text-sm hover:bg-[var(--sv-primary-deep)] transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      Change Face
                    </button>
                  </div>
                </div>

                {/* Face Picker */}
                {facePickerOpen && (
                  <div className="mt-6 pt-6 border-t border-[var(--sv-text-soft)]/15">
                    <p className="text-sm font-bold text-[var(--sv-text)] mb-3">Pick a face:</p>
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                      {AVATAR_FACES.map(face => (
                        <button
                          key={face}
                          onClick={() => handleSetFace(face)}
                          className={`text-3xl p-2 rounded-2xl transition hover:scale-110 hover:bg-[var(--sv-card-tint)] ${
                            selectedFace === face ? 'ring-2 ring-[var(--sv-primary)] bg-[var(--sv-card-tint)]' : ''
                          }`}
                          aria-label={`Set avatar to ${face}`}
                        >
                          {face}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition ${
                      activeCategory === cat
                        ? 'bg-[var(--sv-primary)] text-white shadow-sm'
                        : 'bg-[var(--sv-card)] text-[var(--sv-text-soft)] hover:bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/20'
                    }`}
                  >
                    {cat === 'ALL' ? '🛍️ All Items' : `${CATEGORY_ICONS[cat] || '✨'} ${cat.charAt(0) + cat.slice(1).toLowerCase()}`}
                  </button>
                ))}
              </div>

              {/* Shop Grid */}
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-4">🏪</p>
                  <p className="font-heading font-bold text-xl text-[var(--sv-text)]">No items here yet</p>
                  <p className="text-sm text-[var(--sv-text-soft)] mt-2">Keep playing to unlock more categories!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map(item => (
                    <div
                      key={item.id}
                      className={`bg-[var(--sv-card)] rounded-3xl p-5 border transition shadow-sm flex flex-col ${
                        item.isEquipped
                          ? 'border-[var(--sv-primary)] ring-2 ring-[var(--sv-primary)]/30'
                          : item.isOwned
                          ? 'border-[var(--sv-secondary)]/40'
                          : 'border-[var(--sv-primary)]/15 hover:border-[var(--sv-primary)]/40'
                      }`}
                    >
                      {/* Item emoji */}
                      <div className="text-5xl mb-3 text-center">{item.emoji}</div>

                      {/* Item info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-heading font-bold text-sm text-[var(--sv-text)] leading-tight">{item.name}</h3>
                          {item.isEquipped && (
                            <span className="text-[10px] font-bold bg-[var(--sv-primary)]/15 text-[var(--sv-primary)] px-2 py-0.5 rounded-full">ON</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-[var(--sv-text-soft)] mb-3 leading-tight">{item.description}</p>
                        )}
                      </div>

                      {/* Price + action */}
                      <div className="mt-auto">
                        {!item.isOwned && (
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1 text-sm font-bold text-[var(--sv-text)]">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              {item.price}
                            </div>
                            <span className={`text-[11px] font-bold ${data.coins >= item.price ? 'text-green-500' : 'text-red-400'}`}>
                              {data.coins >= item.price ? 'Can buy!' : 'Need more 🪙'}
                            </span>
                          </div>
                        )}

                        {item.isOwned ? (
                          <button
                            onClick={() => handleEquip(item.id, item.isEquipped)}
                            disabled={equipping === item.id}
                            className={`w-full py-2 rounded-xl font-bold text-sm transition disabled:opacity-60 ${
                              item.isEquipped
                                ? 'bg-[var(--sv-primary)]/20 text-[var(--sv-primary)] hover:bg-[var(--sv-primary)]/30'
                                : 'bg-[var(--sv-primary)] text-white hover:bg-[var(--sv-primary-deep)]'
                            }`}
                          >
                            {equipping === item.id ? '...' : item.isEquipped ? 'Unequip' : 'Equip ✨'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuy(item.id, item.price)}
                            disabled={buying === item.id || data.coins < item.price}
                            className="w-full py-2 rounded-xl font-bold text-sm bg-[var(--sv-primary)] text-white hover:bg-[var(--sv-primary-deep)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {buying === item.id ? 'Buying...' : `Buy for ${item.price} 🪙`}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick links */}
              <div className="mt-10 pt-8 border-t border-[var(--sv-text-soft)]/15 flex gap-4 justify-center flex-wrap">
                <Link href="/wins" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--sv-card)] border border-[var(--sv-primary)]/20 font-bold text-sm hover:bg-[var(--sv-card-tint)] transition">
                  🏆 Win Gallery
                </Link>
                <Link href="/hub" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--sv-primary)] text-white font-bold text-sm hover:bg-[var(--sv-primary-deep)] transition">
                  🏠 Back to Hub
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

