import { useAdminProviders } from '../../hooks/useAdmin'

export function PendingProviders() {
  const { providers, loading, setApproved } = useAdminProviders()

  if (loading) return <p className="muted">Loading…</p>

  return (
    <section className="panel">
      <h2>Providers</h2>
      {providers.length === 0 ? (
        <p className="muted">No providers have signed up yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Category</th>
                <th>City</th>
                <th>Rating</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td>{p.business_name}</td>
                  <td>{p.category}</td>
                  <td>{p.city}</td>
                  <td>
                    {p.avg_rating.toFixed(1)} ({p.review_count})
                  </td>
                  <td>
                    <span className={`badge ${p.is_approved ? 'badge-active' : 'badge-pending'}`}>
                      {p.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="row-actions">
                    {p.is_approved ? (
                      <button className="link danger" onClick={() => setApproved(p.id, false)}>
                        Suspend
                      </button>
                    ) : (
                      <button className="link" onClick={() => setApproved(p.id, true)}>
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
