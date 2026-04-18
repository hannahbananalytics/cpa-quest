export default function Toast({ visible, msg }) {
  return (
    <div className={'toast' + (visible ? ' show' : '')}>
      {msg}
    </div>
  )
}
