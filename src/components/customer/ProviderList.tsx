import { useState } from 'react'
import { useCategories, useProviderSearch } from '../../hooks/useMarketplace'
import { ProviderProfileView } from './ProviderProfileView'
import { formatCurrency, stars } from '../../utils/format'

export function ProviderList({ defaultCity, customerId }: { defaultCity: string; customerId: string }) {
  const categories = useCategories()
  const [category, setCategory] = useState('cleaning')
  const [city, setCity] = useState(defaultCity)
  const [sort, setSort] = useState<'rating' | 'price'>('rating')
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const { providers, loading } = useProviderSearch(category, city)

  if (selectedProviderId) {
    return (
      <ProviderProfileView
        providerId={selectedProviderId}
        customerId={customerId}
        onBack={() => setSelectedProviderId(null)}
      />
    )
  }

  const sorted = [...providers].sort((a, b) => {
    if (sort === 'rating') return b.avg_rating - a.avg_rating
    const aMin = a.services.length ? Math.min(...a.services.map((s) => s.price)) : Infinity
    const bMin = b.services.length ? Math.min(...b.services.map((s) => s.price)) : Infinity
    return aMin - bMin
  })

  return (
    <div>
      <section className="panel">
        <h2>What do you need?</h2>
        <div className="category-grid">
          {categories.map((c) => (
            <button
              key={c.slug}
              className={category === c.slug ? 'category-tile active' : 'category-tile'}
              disabled={!c.is_live}
              onClick={() => setCategory(c.slug)}
              title={c.is_live ? c.label : `${c.label} — coming soon`}
            >
              <span className="category-icon">{c.icon}</span>
              {c.label}
              {!c.is_live && <span className="badge badge-soon">Soon</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="search-row">
          <div>
            <label htmlFor="city">City</label>
            <input
              id="city"
              placeholder="e.g. Austin, TX"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sort">Sort by</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as 'rating' | 'price')}>
              <option value="rating">Highest rated</option>
              <option value="price">Lowest price</option>
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="muted">Loading providers…</p>
      ) : sorted.length === 0 ? (
        <section className="panel">
          <p className="muted">No approved providers yet in this city. Try a different city or check back soon.</p>
        </section>
      ) : (
        <div className="provider-grid">
          {sorted.map((p) => (
            <button key={p.id} className="provider-card" onClick={() => setSelectedProviderId(p.id)}>
              <h3>{p.business_name}</h3>
              <p className="muted small">{p.city}</p>
              <p className="rating">
                {stars(p.avg_rating)} <span className="muted small">({p.review_count})</span>
              </p>
              <p className="muted small">
                {p.services.length > 0
                  ? `From ${formatCurrency(Math.min(...p.services.map((s) => s.price)))}`
                  : 'No services listed yet'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
