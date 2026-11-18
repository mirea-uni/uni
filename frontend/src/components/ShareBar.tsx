interface ShareBarProps {
  share: number
  compact?: boolean
}

// доля пользователя на фоне всего объекта: своя часть залита, остальное — доли совладельцев
function ShareBar({ share, compact = false }: ShareBarProps) {
  return (
    <div className={compact ? 'share compact' : 'share'}>
      <div className="share-track" role="img" aria-label={`Ваша доля ${share}%`}>
        <div className="share-fill" style={{ width: `${share}%` }} />
      </div>
      <div className="share-caption">
        <b>{share}%</b>
        <span>{share === 100 ? 'объект целиком ваш' : `у совладельцев ${100 - share}%`}</span>
      </div>
    </div>
  )
}

export default ShareBar
