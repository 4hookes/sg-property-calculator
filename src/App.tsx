import { useState, useMemo } from 'react'

// Utility functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const parseCurrency = (value: string): number => {
  return Number(value.replace(/[^0-9.-]/g, '')) || 0
}

// Calculate BSD based on purchase price
const calculateBSD = (price: number): number => {
  if (price <= 180000) return price * 0.01
  if (price <= 360000) return 1800 + (price - 180000) * 0.02
  if (price <= 1000000) return 5400 + (price - 360000) * 0.03
  if (price <= 1500000) return 24600 + (price - 1000000) * 0.04
  if (price <= 3000000) return 44600 + (price - 1500000) * 0.05
  return 119600 + (price - 3000000) * 0.06
}

// Calculate max loan based on TDSR and tenure
const calculateMaxLoan = (monthlyTDSR: number, tenureYears: number, rate: number = 0.04): number => {
  const monthlyRate = rate / 12
  const months = tenureYears * 12
  if (monthlyTDSR <= 0 || months <= 0) return 0
  return monthlyTDSR * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate)
}

// Calculate monthly instalment
const calculateMonthlyInstalment = (principal: number, tenureYears: number, rate: number): number => {
  const monthlyRate = rate / 12
  const months = tenureYears * 12
  if (principal <= 0 || months <= 0) return 0
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
}

// Input component for currency
const CurrencyInput = ({
  label,
  value,
  onChange,
  highlight = false
}: {
  label: string
  value: number
  onChange: (value: number) => void
  highlight?: boolean
}) => (
  <div className="flex items-center justify-between py-2">
    <label className="text-gray-700">{label}</label>
    <input
      type="text"
      value={formatCurrency(value)}
      onChange={(e) => onChange(parseCurrency(e.target.value))}
      className={`w-40 px-3 py-2 text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        highlight ? 'bg-yellow-50 border-yellow-300' : 'border-gray-300'
      }`}
    />
  </div>
)

// Display row component
const DisplayRow = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex items-center justify-between py-2 ${bold ? 'font-semibold' : ''}`}>
    <span className="text-gray-700">{label}</span>
    <span className={`${bold ? 'text-lg text-blue-600' : 'text-gray-900'}`}>{value}</span>
  </div>
)

// Section component
const Section = ({
  title,
  children,
  defaultOpen = true
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-xl"
      >
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="px-6 pb-4">{children}</div>}
    </div>
  )
}

// Buyer Profile Component
const BuyerProfile = ({
  buyerNum,
  profile,
  onChange,
}: {
  buyerNum: number
  profile: BuyerProfileData
  onChange: (profile: BuyerProfileData) => void
}) => {
  const currentYear = new Date().getFullYear()
  const age = profile.birthYear ? currentYear - profile.birthYear : 0
  const maxTenure = Math.min(65 - age, 35)
  const tenure = Math.max(0, maxTenure)

  // Adjusted income (for variable, use lower of monthly*12 or NOA, divided by 12)
  const adjustedIncome = profile.incomeType === 'Fixed'
    ? Math.max(profile.monthlyIncome, profile.noa / 12)
    : Math.min(profile.monthlyIncome, profile.noa / 12)

  const tdsr = adjustedIncome * 0.55
  const usableTDSR = Math.max(0, tdsr - profile.currentLoan)
  const maxLoanWithOther = calculateMaxLoan(usableTDSR, tenure)
  const maxLoanWithoutOther = calculateMaxLoan(tdsr, tenure)

  return (
    <div className="flex-1 min-w-[280px]">
      <h3 className="font-medium text-gray-900 mb-3 pb-2 border-b">Buyer {buyerNum}</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Citizenship</label>
          <select
            value={profile.citizenship}
            onChange={(e) => onChange({ ...profile, citizenship: e.target.value as 'SC' | 'PR' | 'Foreigner' })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SC">SC</option>
            <option value="PR">PR</option>
            <option value="Foreigner">Foreigner</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Income Type</label>
          <select
            value={profile.incomeType}
            onChange={(e) => onChange({ ...profile, incomeType: e.target.value as 'Fixed' | 'Variable' })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Fixed">Fixed</option>
            <option value="Variable">Variable</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Monthly Income</label>
          <input
            type="text"
            value={formatCurrency(profile.monthlyIncome)}
            onChange={(e) => onChange({ ...profile, monthlyIncome: parseCurrency(e.target.value) })}
            className="w-28 px-3 py-1.5 text-right border border-gray-300 rounded-lg text-sm bg-yellow-50 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">NOA {currentYear}</label>
          <input
            type="text"
            value={formatCurrency(profile.noa)}
            onChange={(e) => onChange({ ...profile, noa: parseCurrency(e.target.value) })}
            className="w-28 px-3 py-1.5 text-right border border-gray-300 rounded-lg text-sm bg-yellow-50 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Birth Year</label>
          <input
            type="number"
            value={profile.birthYear || ''}
            onChange={(e) => onChange({ ...profile, birthYear: parseInt(e.target.value) || 0 })}
            className="w-28 px-3 py-1.5 text-right border border-gray-300 rounded-lg text-sm bg-yellow-50 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 1990"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Current Loan Payment</label>
          <input
            type="text"
            value={formatCurrency(profile.currentLoan)}
            onChange={(e) => onChange({ ...profile, currentLoan: parseCurrency(e.target.value) })}
            className="w-28 px-3 py-1.5 text-right border border-gray-300 rounded-lg text-sm bg-yellow-50 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Age</span>
            <span>{age} years</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Adjusted Income</span>
            <span>{formatCurrency(adjustedIncome)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">TDSR (55%)</span>
            <span>{formatCurrency(tdsr)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Usable TDSR</span>
            <span>{formatCurrency(usableTDSR)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Loan Tenure</span>
            <span>{tenure} years</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-700">Max Loan (w/ other loans)</span>
            <span className="text-blue-600">{formatCurrency(maxLoanWithOther)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-700">Max Loan (w/o other loans)</span>
            <span className="text-blue-600">{formatCurrency(maxLoanWithoutOther)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface BuyerProfileData {
  citizenship: 'SC' | 'PR' | 'Foreigner'
  incomeType: 'Fixed' | 'Variable'
  monthlyIncome: number
  noa: number
  birthYear: number
  currentLoan: number
}

function App() {
  // Selling section state
  const [sellingPrice, setSellingPrice] = useState(2400000)
  const [outstandingLoan, setOutstandingLoan] = useState(600000)
  const [cpfUsed1, setCpfUsed1] = useState(270000)
  const [accruedInterest1, setAccruedInterest1] = useState(12500)
  const [cpfUsed2, setCpfUsed2] = useState(250000)
  const [accruedInterest2, setAccruedInterest2] = useState(12500)
  const [legalFees, setLegalFees] = useState(3000)

  // Current CPF funds
  const [currentCpf1, setCurrentCpf1] = useState(80000)
  const [currentCpf2, setCurrentCpf2] = useState(50000)

  // Cash from savings
  const [cashSavings, setCashSavings] = useState(500000)

  // Buyer profiles
  const [buyer1, setBuyer1] = useState<BuyerProfileData>({
    citizenship: 'SC',
    incomeType: 'Fixed',
    monthlyIncome: 5000,
    noa: 80000,
    birthYear: 1995,
    currentLoan: 1200,
  })

  const [buyer2, setBuyer2] = useState<BuyerProfileData>({
    citizenship: 'SC',
    incomeType: 'Fixed',
    monthlyIncome: 8000,
    noa: 120000,
    birthYear: 1990,
    currentLoan: 0,
  })

  // Loan settings
  const [interestRate, setInterestRate] = useState(2.0)
  const [loanTenure, setLoanTenure] = useState(30)

  // Calculations
  const cashFromSale = sellingPrice - outstandingLoan - (cpfUsed1 + accruedInterest1) - (cpfUsed2 + accruedInterest2) - legalFees
  const totalAvailable = cashFromSale + cashSavings + currentCpf1 + currentCpf2

  // Calculate max eligible loan (use the higher earner's max loan)
  const currentYear = new Date().getFullYear()
  const age1 = buyer1.birthYear ? currentYear - buyer1.birthYear : 0
  const age2 = buyer2.birthYear ? currentYear - buyer2.birthYear : 0
  const tenure1 = Math.min(65 - age1, 35)
  const tenure2 = Math.min(65 - age2, 35)

  const adjustedIncome1 = buyer1.incomeType === 'Fixed'
    ? Math.max(buyer1.monthlyIncome, buyer1.noa / 12)
    : Math.min(buyer1.monthlyIncome, buyer1.noa / 12)
  const adjustedIncome2 = buyer2.incomeType === 'Fixed'
    ? Math.max(buyer2.monthlyIncome, buyer2.noa / 12)
    : Math.min(buyer2.monthlyIncome, buyer2.noa / 12)

  const tdsr1 = adjustedIncome1 * 0.55
  const tdsr2 = adjustedIncome2 * 0.55
  const usableTDSR1 = Math.max(0, tdsr1 - buyer1.currentLoan)
  const usableTDSR2 = Math.max(0, tdsr2 - buyer2.currentLoan)

  const maxLoan1 = calculateMaxLoan(usableTDSR1, tenure1)
  const maxLoan2 = calculateMaxLoan(usableTDSR2, tenure2)
  const eligibleLoan = Math.max(maxLoan1, maxLoan2)

  // Purchase prices from $700k to $4M
  const purchasePrices = useMemo(() => {
    const prices = []
    for (let p = 700000; p <= 4000000; p += 100000) {
      prices.push(p)
    }
    return prices
  }, [])

  // Calculate purchase details for each price
  const purchaseDetails = useMemo(() => {
    return purchasePrices.map(price => {
      const optionFee = price * 0.01
      const exerciseFee = price * 0.04
      const legal = 3000
      const bsd = calculateBSD(price)
      const absd = 0 // Assuming SC buying first property
      const downpayment = price * 0.20
      const upfrontRequired = optionFee + exerciseFee + legal + bsd + absd
      const loan75 = price * 0.75
      const loanShortfall = Math.max(0, loan75 - eligibleLoan)
      const actualLoan = Math.min(loan75, eligibleLoan)
      const monthlyInstalment = calculateMonthlyInstalment(actualLoan, loanTenure, interestRate / 100)
      const rentalYield = price * 0.03 / 12

      // Additional calculations for shortfall scenarios
      const additionalTDSR = loanShortfall > 0
        ? calculateMonthlyInstalment(loanShortfall, 30, 0.04)
        : 0
      const pledge = loanShortfall > 0 ? loanShortfall * (5 / 12) : 0 // ~41.67% of shortfall
      const showFund = loanShortfall > 0 ? loanShortfall * (25 / 18) : 0 // ~138.89% of shortfall

      return {
        price,
        optionFee,
        exerciseFee,
        legal,
        bsd,
        absd,
        downpayment,
        upfrontRequired,
        loan75,
        loanShortfall,
        additionalTDSR,
        pledge,
        showFund,
        monthlyInstalment,
        rentalYield,
        canAfford: upfrontRequired <= totalAvailable && loanShortfall === 0,
      }
    })
  }, [purchasePrices, eligibleLoan, loanTenure, interestRate, totalAvailable])

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Property Financial Plan</h1>

        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <span className="inline-block w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></span>
          <span>Yellow fields are inputs</span>
        </div>

        {/* Selling Section */}
        <Section title="Selling Financial Plan">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <CurrencyInput label="Selling Price" value={sellingPrice} onChange={setSellingPrice} highlight />
              <CurrencyInput label="Outstanding Loan" value={outstandingLoan} onChange={setOutstandingLoan} highlight />
              <CurrencyInput label="CPF Used (Buyer 1)" value={cpfUsed1} onChange={setCpfUsed1} highlight />
              <CurrencyInput label="Accrued Interest (Buyer 1)" value={accruedInterest1} onChange={setAccruedInterest1} highlight />
              <CurrencyInput label="CPF Used (Buyer 2)" value={cpfUsed2} onChange={setCpfUsed2} highlight />
              <CurrencyInput label="Accrued Interest (Buyer 2)" value={accruedInterest2} onChange={setAccruedInterest2} highlight />
              <CurrencyInput label="Legal Fees" value={legalFees} onChange={setLegalFees} highlight />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Cash from Sale</h3>
              <DisplayRow label="Selling Price" value={formatCurrency(sellingPrice)} />
              <DisplayRow label="Less: Outstanding Loan" value={`-${formatCurrency(outstandingLoan)}`} />
              <DisplayRow label="Less: CPF Refund (Buyer 1)" value={`-${formatCurrency(cpfUsed1 + accruedInterest1)}`} />
              <DisplayRow label="Less: CPF Refund (Buyer 2)" value={`-${formatCurrency(cpfUsed2 + accruedInterest2)}`} />
              <DisplayRow label="Less: Legal Fees" value={`-${formatCurrency(legalFees)}`} />
              <div className="border-t mt-2 pt-2">
                <DisplayRow label="Cash from Sale" value={formatCurrency(cashFromSale)} bold />
              </div>
            </div>
          </div>
        </Section>

        {/* After Sale Position */}
        <Section title="After Sale Position">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Current CPF Funds</h3>
              <CurrencyInput label="Buyer 1 CPF" value={currentCpf1} onChange={setCurrentCpf1} highlight />
              <CurrencyInput label="Buyer 2 CPF" value={currentCpf2} onChange={setCurrentCpf2} highlight />
              <div className="mt-4">
                <CurrencyInput label="Cash from Savings" value={cashSavings} onChange={setCashSavings} highlight />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Total Available Funds</h3>
              <DisplayRow label="Cash from Sale" value={formatCurrency(cashFromSale)} />
              <DisplayRow label="Cash from Savings" value={formatCurrency(cashSavings)} />
              <DisplayRow label="CPF (Buyer 1)" value={formatCurrency(currentCpf1)} />
              <DisplayRow label="CPF (Buyer 2)" value={formatCurrency(currentCpf2)} />
              <div className="border-t border-blue-200 mt-2 pt-2">
                <DisplayRow label="Total Available" value={formatCurrency(totalAvailable)} bold />
              </div>
            </div>
          </div>
        </Section>

        {/* Buyer Profiles */}
        <Section title="Buyer Profiles (TDSR at 55%)">
          <div className="flex flex-wrap gap-8">
            <BuyerProfile buyerNum={1} profile={buyer1} onChange={setBuyer1} />
            <BuyerProfile buyerNum={2} profile={buyer2} onChange={setBuyer2} />
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Combined Eligible Loan Amount</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(eligibleLoan)}</span>
            </div>
          </div>
        </Section>

        {/* Loan Settings */}
        <Section title="Loan Settings">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <label className="text-gray-700">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                className="w-24 px-3 py-2 text-right border border-yellow-300 bg-yellow-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-gray-700">Loan Tenure (Years)</label>
              <input
                type="number"
                value={loanTenure}
                onChange={(e) => setLoanTenure(parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 text-right border border-yellow-300 bg-yellow-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Section>

        {/* Purchasing Table */}
        <Section title="Purchasing Financial Plan">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 sticky left-0 bg-gray-50">Purchase Price</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">1% Option</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">4% Exercise</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Legal</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">BSD</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">20% Down</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Upfront Req.</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">75% Loan</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Loan Shortfall</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Add. TDSR</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Pledge</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Show Fund</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Monthly (MI)</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Rental (3%)</th>
                </tr>
              </thead>
              <tbody>
                {purchaseDetails.map((detail, index) => (
                  <tr
                    key={detail.price}
                    className={`border-b ${detail.canAfford ? 'bg-green-50' : ''} ${index % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                  >
                    <td className={`px-3 py-2 font-medium sticky left-0 ${detail.canAfford ? 'bg-green-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>{formatCurrency(detail.price)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.optionFee)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.exerciseFee)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.legal)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.bsd)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.downpayment)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(detail.upfrontRequired)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.loan75)}</td>
                    <td className={`px-3 py-2 text-right ${detail.loanShortfall > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      {detail.loanShortfall > 0 ? formatCurrency(detail.loanShortfall) : '-'}
                    </td>
                    <td className={`px-3 py-2 text-right ${detail.additionalTDSR > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {detail.additionalTDSR > 0 ? formatCurrency(Math.round(detail.additionalTDSR)) : '-'}
                    </td>
                    <td className={`px-3 py-2 text-right ${detail.pledge > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {detail.pledge > 0 ? formatCurrency(Math.round(detail.pledge)) : '-'}
                    </td>
                    <td className={`px-3 py-2 text-right ${detail.showFund > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {detail.showFund > 0 ? formatCurrency(Math.round(detail.showFund)) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(Math.round(detail.monthlyInstalment))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(Math.round(detail.rentalYield))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-green-50 border border-green-200 rounded"></span>
              <span>Green rows = affordable based on your funds and loan eligibility</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded" style={{backgroundColor: 'rgb(234 88 12 / 0.1)'}}></span>
              <span>Orange values = additional requirements when there's a loan shortfall</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

export default App
