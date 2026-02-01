import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Home from './pages/Home'
import AddTransaction from './pages/AddTransaction'
import TransactionList from './pages/TransactionList'
import BudgetList from './pages/BudgetList'
import BudgetDetail from './pages/BudgetDetail'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/transactions/new" element={<AddTransaction />} />
            <Route path="/budgets" element={<BudgetList />} />
            <Route path="/budgets/:id" element={<BudgetDetail />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
