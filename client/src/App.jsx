import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import FilterPanel from './components/FilterPanel'
import FilterDisplay from './components/FilterDisplay'
import ResetButton from './components/ResetButton'

function formatMoney(n) {
  if (n == null) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function App() {
  const [health, setHealth] = useState(null)
  const [messages, setMessages] = useState(() => ([
    { role: 'assistant', content: 'Tell me what you\'re looking for. For example: "3-bed homes in Denver under 650k" or "Condos in San Diego new this week under $900k".' }
  ]))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState({
    assistantSummary: '',
    listings: [],
    refinements: [],
    total: 0,
    page: 1,
    pageSize: 10,
    filters: null,
    clarifyingQuestions: []
  })

  const scrollRef = useRef(null)

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => { })
  }, [])

  useEffect(() => {
    // Auto scroll to bottom of message list on updates
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  // Generate a unique session ID for the conversation
  const [sessionId] = useState(() => {
    // Simple random ID generator
    return Math.random().toString(36).substring(2, 15)
  })

  async function sendMessage(raw) {
    const text = String(raw ?? input).trim()
    if (!text) return
    setError('')
    setLoading(true)

    // append user message
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')

    // Determine if this is a new query or continuation
    // If messages length is 1 (only initial assistant message), treat as new query
    const isNewQuery = messages.length <= 1

    try {
      const res = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, isNewQuery, sessionId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Request failed (${res.status})`)
      }
      const data = await res.json()
      // assistant message is the assistantSummary or a clarification prompt
      const assistantText = data.assistantSummary
        ? data.assistantSummary
        : (data.clarifyingQuestions?.[0] || 'I need a bit more information to search.')

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
      setResults({
        assistantSummary: data.assistantSummary || '',
        listings: data.listings || [],
        refinements: data.refinements || [],
        total: data.total ?? 0,
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 10,
        filters: data.filters ?? null,
        clarifyingQuestions: data.clarifyingQuestions || [],
      })
    } catch (e) {
      setError(e.message || 'Something went wrong')
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong fetching results.' }])
    } finally {
      setLoading(false)
    }
  }

  function onRefinementClick(msg) {
    // Send the refinement text as a new user input
    return sendMessage(msg)
  }

  function onRemoveFilter(filterKey) {
    // Reconstruct the query by removing the specific filter
    const currentFilters = results.filters || {};
    const { [filterKey]: removedFilter, ...remainingFilters } = currentFilters;

    // Reconstruct a query message based on remaining filters
    const filterToQueryMap = {
      location: (val) => `in ${val}`,
      price: (val) => `${val.min ? `from $${val.min}` : ''} ${val.max ? `under $${val.max}` : ''}`,
      beds: (val) => `${val.min} bed`,
      baths: (val) => `${val.min} bath`,
      propertyTypes: (val) => val.join(', '),
      daysOnMarket: (val) => `listed in last ${val} days`,
      keywords: (val) => val.join(' '),
      sortBy: (val) => `sorted by ${val}`
    };

    const queryParts = Object.entries(remainingFilters)
      .filter(([key]) => key !== 'page')
      .map(([key, value]) => filterToQueryMap[key](value))
      .join(' ');

    // Send the reconstructed query
    const reconstructedQuery = queryParts.trim() || 'homes';
    return sendMessage(reconstructedQuery);
  }

  return (
    <div className="app">
      <header className="appHeader">
        <div>
          <h1 className="title">My Next Home</h1>
          <div className="subtitle">Conversational home search (MVP)</div>
        </div>
        <div className="health">
          <span className={`dot ${health?.ok ? 'ok' : 'bad'}`} />
          <span className="healthText">{health?.ok ? 'API connected' : 'API unknown'}</span>
        </div>
      </header>

      <main className="main">
        <section className="chatPane">
          <div className="messages" ref={scrollRef} aria-live="polite" aria-label="Conversation">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role === 'assistant' ? 'assistant' : 'user'}`}>
                <div className="bubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="msg assistant">
                <div className="bubble bubbleLoading">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <form
            className="inputBar"
            onSubmit={(e) => { e.preventDefault(); if (canSend) sendMessage() }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Try: "3-bed homes in Denver under 650k"'
              aria-label="Message"
            />
            <ResetButton
              onReset={() => {
                // Reset local state and potentially clear context
                setResults({
                  assistantSummary: '',
                  listings: [],
                  refinements: [],
                  total: 0,
                  page: 1,
                  pageSize: 10,
                  filters: null,
                  clarifyingQuestions: []
                });
                setMessages([
                  { role: 'assistant', content: 'Tell me what you\'re looking for. For example: "3-bed homes in Denver under 650k" or "Condos in San Diego new this week under $900k".' }
                ]);
              }}
            />
            <button type="submit" disabled={!canSend}>Send</button>
          </form>

          {!!results.refinements?.length && (
            <div className="chips" role="group" aria-label="Refinements">
              {results.refinements.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip"
                  onClick={() => onRefinementClick(r.message)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {!!results.clarifyingQuestions?.length && (
            <div className="clarifications">
              {results.clarifyingQuestions.map((q, idx) => (
                <div key={idx} className="clarifyItem">• {q}</div>
              ))}
            </div>
          )}

          {error && <div className="error">{error}</div>}
        </section>

        <section className="resultsPane">
          <div className="resultsHeader">
            <div className="resultsTitle">Results</div>
            <div className="resultsMeta">
              {results.total ? `${Math.min(results.pageSize ?? 10, results.listings?.length ?? 0)} of ${results.total}` : '—'}
            </div>
          </div>

          {results.filters && (
            <FilterPanel
              filters={results.filters}
              onRemoveFilter={onRemoveFilter}
            />
          )}

          {!loading && (!results.listings || results.listings.length === 0) ? (
            <EmptyState />
          ) : (
            <div className="grid">
              {results.listings?.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        Data and availability subject to change. Links take you to Zillow for canonical details.
      </footer>
    </div>
  )
}

function ListingCard({ l }) {
  return (
    <article className="card" role="article" aria-label={`${l.address}, ${l.city} ${l.state}`}>
      <div className="cardImageWrap">
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img className="cardImage" src={l.heroPhoto} alt={`Photo of ${l.address}`} loading="lazy" />
        {Array.isArray(l.tags) && l.tags.length > 0 && (
          <div className="cardBadges">
            {l.tags.slice(0, 2).map((t, i) => (
              <span key={i} className="badge">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="cardBody">
        <div className="price">{formatMoney(l.price)}</div>
        <div className="address">{l.address}</div>
        <div className="sub">{l.city}, {l.state} {l.zip}</div>
        <div className="facts">
          <span>{l.beds ?? '—'} bd</span>
          <span>•</span>
          <span>{l.baths ?? '—'} ba</span>
          <span>•</span>
          <span>{l.sqft ?? '—'} sqft</span>
        </div>
        {l.excerpt && <div className="excerpt">{l.excerpt}</div>}
        <div className="actions">
          <a className="zillowLink" href={l.listingUrl} target="_blank" rel="noopener noreferrer">View on Zillow ↗</a>
        </div>
      </div>
    </article>
  )
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="emptyTitle">No results yet</div>
      <div className="emptyBody">
        Try a query like:
        <ul>
          <li>"3-bed homes in Denver under 650k"</li>
          <li>"Condos in San Diego new this week under 900k"</li>
          <li>"Townhomes in Austin with a garage"</li>
        </ul>
      </div>
    </div>
  )
}
