'use client'
import { useState } from 'react'

interface Props {
  onInsert: (latex: string) => void
}

export default function InsertToolbar({ onInsert }: Props) {
  const [showEquation, setShowEquation] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [tableData, setTableData] = useState('')

  function insertEquationPlaceholder() {
    onInsert('\\begin{equation}\n  \n\\end{equation}')
    setShowEquation(false)
  }

  function insertTableFromData() {
    if (!tableData.trim()) return
    onInsert(`\\begin{table}[h]\n\\centering\n% TODO: formatted table\n\\caption{Table}\n\\label{tab:1}\n\\end{table}`)
    setTableData('')
    setShowTable(false)
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="relative">
        <button onClick={() => setShowEquation(!showEquation)} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">Equation</button>
        {showEquation && (
          <div className="absolute top-full mt-1 bg-white border rounded shadow-lg p-2 z-20 space-y-1 w-40">
            <button onClick={insertEquationPlaceholder} className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-50">Upload image</button>
            <button onClick={insertEquationPlaceholder} className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-50">Draw equation</button>
          </div>
        )}
      </div>
      <div className="relative">
        <button onClick={() => setShowTable(!showTable)} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">Table</button>
        {showTable && (
          <div className="absolute top-full mt-1 bg-white border rounded shadow-lg p-3 z-20 w-56">
            <textarea value={tableData} onChange={e => setTableData(e.target.value)} placeholder="Paste CSV data here..." className="w-full border rounded p-1 text-xs h-20 mb-2" />
            <button onClick={insertTableFromData} className="w-full bg-blue-600 text-white rounded px-2 py-1 text-xs">Convert</button>
          </div>
        )}
      </div>
      <button onClick={() => onInsert('\\begin{figure}[h]\n\\centering\n\\includegraphics[width=0.8\\linewidth]{}\n\\caption{}\n\\label{fig:1}\n\\end{figure}')} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">
        Figure
      </button>
    </div>
  )
}
