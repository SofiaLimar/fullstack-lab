import { useEffect, useState } from 'react'
import { listEvents, register } from './api.js'

// Esta tela já tem a estrutura visual. Sua tarefa é ligá-la à API e ao estado React.
// Consulte docs/checkpoint-04.md antes de substituir os dados de exemplo.
export default function App() {
  const [userId, setUserId] = useState(1)
  const [events, setEvents] = useState([])         
  const [loading, setLoading] = useState(true)    
  const [error, setError] = useState('')          
  const [success, setSuccess] = useState('')      
  const [submittingId, setSubmittingId] = useState(null) 

  useEffect(() => {
  async function loadEvents() {
    try {
      setEvents(await listEvents())
    } catch {
      setError('Não foi possível carregar os eventos.')
    } finally {
      setLoading(false)
    }
  }
  loadEvents()
}, [])

async function handleRegister(eventId) {
  setSubmittingId(eventId)
  setError('')
  setSuccess('')
  try {
    await register(eventId, userId)
    setSuccess('Inscrição realizada com sucesso!')
    setEvents(await listEvents())
  } catch (err) {
    setError(err.message)
  } finally {
    setSubmittingId(null)
  }
}

  return <main className="page">
    <header>
      <p className="eyebrow">Trilha · Laboratório Full Stack</p>
      <h1>Eventos</h1>
      <p>Encontre uma atividade e garanta sua vaga.</p>
    </header>

    <label className="user-picker">Participante de demonstração
      <select value={userId} onChange={event => setUserId(Number(event.target.value))}>
        <option value="1">Pessoa 1</option>
        <option value="2">Pessoa 2</option>
      </select>
    </label>

{error && <p role="alert">{error}</p>}
{success && <p role="status">{success}</p>}
{loading && <p>Carregando eventos...</p>}
{!loading && !error && events.length === 0 && <p>Nenhum evento encontrado.</p>}

<section aria-label="Lista de eventos" className="events">
  {events.map(item => <article className="card" key={item.id}>
    <p className="date">{item.date}</p>
    <h2>{item.title}</h2>
    <p>{item.available_slots} {item.available_slots === 1 ? 'vaga disponível' : 'vagas disponíveis'}</p>
    <button
      type="button"
      disabled={submittingId === item.id || item.available_slots === 0}
      onClick={() => handleRegister(item.id)}
    >Inscrever-se</button>
  </article>)}
</section>
</main>
}
