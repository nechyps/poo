import './Message.css'

function Message({ text, visible }) {
  if (!visible || !text) return null

  return (
    <div className="message-container">
      <div className="message-bubble">
        {text}
      </div>
    </div>
  )
}

export default Message

