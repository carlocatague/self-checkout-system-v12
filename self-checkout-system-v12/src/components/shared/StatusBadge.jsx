const ICONS = {
  pending: 'fa-clock',
  preparing: 'fa-fire',
  ready: 'fa-bell',
  completed: 'fa-check-circle',
  cancelled: 'fa-times-circle',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      <i className={`fas ${ICONS[status] || 'fa-circle'}`} />
      {status}
    </span>
  )
}
