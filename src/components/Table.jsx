export default function Table({ columns, data, onEdit, onDelete, loading }) {
  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500">Nenhum registro encontrado</div>
  }

  const hasCustomActions = columns.some(col => col.key === 'acoes')
  const shouldRenderDefaultActions = !hasCustomActions && (onEdit || onDelete)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-2 text-left font-semibold text-gray-700">
                {col.label}
              </th>
            ))}
            {shouldRenderDefaultActions && (
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {shouldRenderDefaultActions && (
                <td className="px-4 py-3">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2 hover:bg-blue-600"
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja deletar?')) {
                          onDelete(row.id)
                        }
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Deletar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
