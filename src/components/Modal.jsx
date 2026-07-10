export default function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-onforge-black/50 hover:text-onforge-black/80 text-2xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
