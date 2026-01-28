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

// Calculate Max Loan based on MSR (30%)
const calculateMaxLoanMSR = (monthlyIncome: number, tenureYears: number, rate: number = 0.026): number => {
  const msrLimit = monthlyIncome * 0.30
  const monthlyRate = rate / 12
  const months = tenureYears * 12
  if (msrLimit <= 0 || months <= 0) return 0
  return msrLimit * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate)
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
      className={`w-40 px-3 py-2 text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${highlight ? 'bg-yellow-50 border-yellow-300' : 'border-gray-300'
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
  const currentYear = new Date().getFullYear()

  // Property Type State
  const [propertyType, setPropertyType] = useState<'Private' | 'HDB'>('Private')
  const [loanType, setLoanType] = useState<'HDB' | 'Bank'>('Bank')
  const [grants, setGrants] = useState(0)

  // Selling section state
  const [sellingPrice, setSellingPrice] = useState(2400000)
  const [outstandingLoan, setOutstandingLoan] = useState(600000)
  const [cpfUsed1, setCpfUsed1] = useState(270000)
  const [accruedInterest1, setAccruedInterest1] = useState(12500)
  const [cpfUsed2, setCpfUsed2] = useState(250000)
  const [accruedInterest2, setAccruedInterest2] = useState(12500)

  const [legalFees, setLegalFees] = useState(3000)
  const [sellingAgentFeeRate] = useState(2.0) // 2% default

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



  // Monthly OA (Combined) - Estimate 23% of income (capped at $8000 base -> $1840/pax max?)
  // Actually max OA contribution is based on Ordinary Wage ceiling ($8000 from 2026? $6800 in 2024? let's use user input for precision)
  const [monthlyOA, setMonthlyOA] = useState(0)

  // Buying Plan State
  const [targetPrice, setTargetPrice] = useState(1000000)
  const [targetCash, setTargetCash] = useState(250000)
  const [targetCPF1, setTargetCPF1] = useState(100000)
  const [targetCPF2, setTargetCPF2] = useState(50000)

  // Auto-update OA estimate
  const calculateOA = (p1: BuyerProfileData, p2: BuyerProfileData) => {
    const calc = (income: number, birthYear: number) => {
      const age = new Date().getFullYear() - birthYear
      const cappedIncome = Math.min(income, 8000)
      let rate = 0.23
      if (age > 35) rate = 0.21
      if (age > 45) rate = 0.19
      if (age > 50) rate = 0.15
      return cappedIncome * rate
    }
    return calc(p1.monthlyIncome, p1.birthYear) + calc(p2.monthlyIncome, p2.birthYear)
  }

  const handleBuyer1Change = (newProfile: BuyerProfileData) => {
    setBuyer1(newProfile)
    setMonthlyOA(calculateOA(newProfile, buyer2))
  }

  const handleBuyer2Change = (newProfile: BuyerProfileData) => {
    setBuyer2(newProfile)
    setMonthlyOA(calculateOA(buyer1, newProfile))
  }

  // Loan settings
  const [interestRate, setInterestRate] = useState(2.0)
  const [loanTenure, setLoanTenure] = useState(30)



  // Calculations
  const sellingAgentFee = sellingPrice * (sellingAgentFeeRate / 100) * 1.09 // 9% GST
  const cashFromSale = sellingPrice - outstandingLoan - (cpfUsed1 + accruedInterest1) - (cpfUsed2 + accruedInterest2) - legalFees - sellingAgentFee

  // Total Available should include the CPF returned from sale
  const totalCpf1 = currentCpf1 + cpfUsed1 + accruedInterest1
  const totalCpf2 = currentCpf2 + cpfUsed2 + accruedInterest2

  const totalAvailable = cashFromSale + cashSavings + totalCpf1 + totalCpf2

  // Calculate max eligible loan (use the higher earner's max loan)
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

  const maxLoan1 = calculateMaxLoan(usableTDSR1, tenure1, interestRate / 100)
  const maxLoan2 = calculateMaxLoan(usableTDSR2, tenure2, interestRate / 100)

  // For HDB, also check MSR (30%)
  // HDB MSR is based on Gross Monthly Income, not Adjusted/TDSR income usually?
  // Simplification: Use adjusted income for now or exact monthly income
  // MSR applies to HDB and EC. Limit is 30% of gross monthly income.
  const msrLimit1 = calculateMaxLoanMSR(buyer1.monthlyIncome, tenure1, interestRate / 100)
  const msrLimit2 = calculateMaxLoanMSR(buyer2.monthlyIncome, tenure2, interestRate / 100)

  let eligibleLoan = Math.max(maxLoan1, maxLoan2)

  if (propertyType === 'HDB') {
    // If HDB, take min of TDSR-based loan and MSR-based loan
    const loan1 = Math.min(maxLoan1, msrLimit1)
    const loan2 = Math.min(maxLoan2, msrLimit2)
    eligibleLoan = Math.max(loan1, loan2)
  }

  // Buying Plan Calculations
  const targetBSD = calculateBSD(targetPrice)
  const targetBuyerAgentFee = propertyType === 'HDB' ? targetPrice * 0.01 * 1.09 : 0
  const targetLegal = 3000
  // Note: Option/Exercise fees are part of the price essentially, usually paid in cash first.
  // We focus on the "Loan Required" math here: Price - Cash - CPF.

  const targetLoanRequired = Math.max(0, targetPrice - targetCash - targetCPF1 - targetCPF2)

  // Validation
  let targetLTVLimit = 0.75
  if (propertyType === 'HDB' && loanType === 'HDB') targetLTVLimit = 0.80
  const maxLTVLoanAmount = targetPrice * targetLTVLimit

  const isLTVExceeded = targetLoanRequired > maxLTVLoanAmount
  const isAffordabilityExceeded = targetLoanRequired > eligibleLoan

  const targetMonthlyInstalment = calculateMonthlyInstalment(targetLoanRequired, loanTenure, interestRate / 100)
  const targetCashTopUp = Math.max(0, targetMonthlyInstalment - monthlyOA)

  // Runway for Target Plan
  // Available CPF for runway = (Total Available CPFs from sale) - (CPF used in plan)
  // Assuming inputs targetCPF1/2 are what they intended to use from their funds.
  const targetRemainingCPF = Math.max(0, (totalCpf1 + totalCpf2) - (targetCPF1 + targetCPF2))
  let targetRunway = 999
  if (targetCashTopUp > 0) {
    targetRunway = targetRemainingCPF / (targetCashTopUp * 12)
  }

  // Purchase prices from $300k to $4M
  const purchasePrices = useMemo(() => {
    const prices = []
    const start = propertyType === 'HDB' ? 300000 : 700000
    const end = propertyType === 'HDB' ? 1500000 : 4000000
    const step = propertyType === 'HDB' ? 50000 : 100000
    for (let p = start; p <= end; p += step) {
      prices.push(p)
    }
    return prices
  }, [propertyType])

  // Calculate purchase details for each price
  const purchaseDetails = useMemo(() => {
    return purchasePrices.map(price => {
      const optionFee = price * 0.01
      const exerciseFee = price * 0.04
      const legal = 3000
      const bsd = calculateBSD(price)
      const absd = 0 // Assuming SC buying first property

      // Buying Agent Fee (1% + GST for HDB, 0 for Private)
      const buyerAgentFee = propertyType === 'HDB' ? price * 0.01 * 1.09 : 0

      // LTV and Downpayment Logic
      let ltv = 0.75

      if (propertyType === 'HDB') {
        if (loanType === 'HDB') {
          ltv = 0.80
        } else {
          ltv = 0.75
        }
      }


      const minDownpayment = price * (1 - ltv)

      // Breakdown Downpayment into Cash and CPF
      // Private: Min 5% Cash. Bank Loan HDB: Min 5% Cash. HDB Loan: 0% Cash.
      // PLUS: Agent Fee is usually CASH.
      // PLUS: Option/Exercise is CASH first, but reimbursed? Or counts to 5%?
      // Simplified "Cash Deposit Requirement":
      //   Min Cash (5% or 0%) + Agent Fee + Any Shortfall (handled later)
      //   Stamp Duties can be CPF. Legal can be CPF.

      let minCashPercent = 0.05
      if (propertyType === 'HDB' && loanType === 'HDB') minCashPercent = 0

      const minCashDown = price * minCashPercent

      // Actually, define "Cash Deposit" as what user ASKED: 
      // "Cash deposit", "CPF deposit"
      // Let's assume Cash Deposit = Min Cash Component + Agent Fee
      // And CPF Deposit = Balance of Downpayment + BSD + ABSD + Legal
      // (Assuming sufficient CPF. If not, overflow to Cash - but for "Plan" lets show required CPF)

      const cashDeposit = minCashDown + buyerAgentFee
      // CPF Deposit covers the rest of the 20/25% downpayment + Fees
      const cpfDeposit = (minDownpayment - minCashDown) + bsd + absd + legal

      // Total Upfront (Cash + CPF)
      const upfrontRequired = cashDeposit + cpfDeposit

      // Calculate shortfall
      const maxLTVLoan = price * ltv
      const actualEligible = eligibleLoan
      const actualLoan = Math.min(maxLTVLoan, actualEligible)

      const loanShortfall = Math.max(0, maxLTVLoan - actualLoan)
      const monthlyInstalment = calculateMonthlyInstalment(actualLoan, loanTenure, interestRate / 100)
      const rentalYield = price * 0.03 / 12

      // Monthly Shortfall / Surplus
      // Monthly Cash Top-up = Installment - OA
      const cashTopUp = Math.max(0, monthlyInstalment - monthlyOA)

      // Runway
      // Remaining CPF = Total Available - CPF Deposit Used
      // If we have shortfall, does it come from CPF? 
      // User said: "If they have access to CPF after the sales, then we should be taking the $2,000 from their balance OA."
      // So Runway is based on (Total Available - Upfront CPF) / TopUp
      const remainingCPFBalance = Math.max(0, (totalCpf1 + totalCpf2) - cpfDeposit) // Simplified, assumes all CPF usage

      let runwayYears = 0
      if (cashTopUp > 0) {
        runwayYears = remainingCPFBalance / (cashTopUp * 12)
      } else {
        runwayYears = 999 // Infinite
      }

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
        buyerAgentFee,
        cashDeposit,
        cpfDeposit,
        activeLTV: ltv,
        upfrontRequired,
        loanLTV: maxLTVLoan,
        loanShortfall,
        additionalTDSR,
        pledge,
        showFund,
        monthlyInstalment,
        rentalYield,
        monthlyOA,
        cashTopUp,
        runwayYears,
        remainingCPFBalance,
        canAfford: upfrontRequired <= (totalAvailable + grants) && loanShortfall === 0,
      }
    })
  }, [purchasePrices, eligibleLoan, loanTenure, interestRate, totalAvailable, propertyType, loanType, grants, monthlyOA, totalCpf1, totalCpf2])

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Property Financial Plan</h1>

        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <span className="inline-block w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></span>
          <span>Yellow fields are inputs</span>
        </div>

        {/* Property Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setPropertyType('Private')}
                  className={`px-4 py-2 text-sm font-medium ${propertyType === 'Private' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Private
                </button>
                <button
                  onClick={() => setPropertyType('HDB')}
                  className={`px-4 py-2 text-sm font-medium ${propertyType === 'HDB' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  HDB / EC
                </button>
              </div>
            </div>

            {propertyType === 'HDB' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setLoanType('Bank')}
                      className={`px-4 py-2 text-sm font-medium ${loanType === 'Bank' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Bank Loan
                    </button>
                    <button
                      onClick={() => {
                        setLoanType('HDB')
                        setInterestRate(2.6)
                      }}
                      className={`px-4 py-2 text-sm font-medium ${loanType === 'HDB' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      HDB Loan
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Est. Grants</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCurrency(grants)}
                      onChange={(e) => setGrants(parseCurrency(e.target.value))}
                      className="w-32 px-3 py-2 text-right border border-yellow-300 bg-yellow-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
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
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-700">Less: Agent Fee (2% + GST)</span>
                <span className="text-gray-900">-{formatCurrency(sellingAgentFee)}</span>
              </div>
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
              <DisplayRow label="CPF (Buyer 1) w/ Refund" value={formatCurrency(totalCpf1)} />
              <DisplayRow label="CPF (Buyer 2) w/ Refund" value={formatCurrency(totalCpf2)} />
              <div className="border-t border-blue-200 mt-2 pt-2">
                <DisplayRow label="Total Available" value={formatCurrency(totalAvailable)} bold />
              </div>
            </div>
          </div>
        </Section>

        {/* Buyer Profiles */}
        <Section title="Buyer Profiles (TDSR at 55%)">
          <div className="flex flex-wrap gap-8">
            <BuyerProfile buyerNum={1} profile={buyer1} onChange={handleBuyer1Change} />
            <BuyerProfile buyerNum={2} profile={buyer2} onChange={handleBuyer2Change} />
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Combined Eligible Loan Amount</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(eligibleLoan)}</span>
            </div>
          </div>
        </Section>

        {/* Buying Plan Calculator */}
        <Section title="Buying Plan Calculator">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 border-b pb-2">Plan Inputs</h3>
              <CurrencyInput label="Target Purchase Price" value={targetPrice} onChange={setTargetPrice} highlight />
              <CurrencyInput label="Cash Downpayment" value={targetCash} onChange={setTargetCash} highlight />
              <CurrencyInput label="CPF Usage (Buyer 1)" value={targetCPF1} onChange={setTargetCPF1} highlight />
              <CurrencyInput label="CPF Usage (Buyer 2)" value={targetCPF2} onChange={setTargetCPF2} highlight />

              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Est. Fees (BSD + Legal + Agent)</span>
                  <span>{formatCurrency(targetBSD + targetLegal + targetBuyerAgentFee)}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-800">
                  <span>Total Initial Cost (Price + Fees)</span>
                  <span>{formatCurrency(targetPrice + targetBSD + targetLegal + targetBuyerAgentFee)}</span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 ${isLTVExceeded || isAffordabilityExceeded ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">Loan Details</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Loan Required (a)</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(targetLoanRequired)}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>LTV Limit ({targetLTVLimit * 100}%)</span>
                    <span className={isLTVExceeded ? 'text-red-600 font-bold' : 'text-green-700'}>
                      {isLTVExceeded ? 'Exceeded' : 'Pass'} ({formatCurrency(maxLTVLoanAmount)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Eligible Loan (Inc. MSR/TDSR)</span>
                    <span className={isAffordabilityExceeded ? 'text-red-600 font-bold' : 'text-green-700'}>
                      {isAffordabilityExceeded ? 'Exceeded' : 'Pass'} ({formatCurrency(eligibleLoan)})
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">Monthly Installment</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(targetMonthlyInstalment)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Combined Monthly OA</span>
                    <span>-{formatCurrency(monthlyOA)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Cash Top-up Required</span>
                    <span className={targetCashTopUp > 0 ? 'text-red-600' : 'text-gray-500'}>
                      {targetCashTopUp > 0 ? formatCurrency(targetCashTopUp) : '$0'}
                    </span>
                  </div>
                  {targetCashTopUp > 0 && (
                    <div className="mt-2 text-right text-sm">
                      <span className="text-gray-600 mr-2">CPF Runway:</span>
                      <span className={targetRunway < 5 ? 'text-red-600 font-bold' : 'text-green-600'}>
                        {targetRunway > 50 ? '> 50 years' : `${targetRunway.toFixed(1)} years`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
                className={`w-24 px-3 py-2 text-right border border-yellow-300 bg-yellow-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${loanType === 'HDB' ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={propertyType === 'HDB' && loanType === 'HDB'}
              />
              {propertyType === 'HDB' && loanType === 'HDB' && <span className="text-xs text-gray-500">(Fixed for HDB Loan)</span>}
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

            <div className="flex items-center gap-3 border-l pl-6 ml-6">
              <label className="text-gray-700 font-medium">Combined Monthly OA</label>
              <input
                type="text"
                value={formatCurrency(monthlyOA)}
                onChange={(e) => setMonthlyOA(parseCurrency(e.target.value))}
                className="w-32 px-3 py-2 text-right border border-yellow-300 bg-yellow-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Cash Deposit</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">CPF Deposit</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Stamp Duty</th>
                  {propertyType === 'HDB' && <th className="px-3 py-2 text-right font-medium text-gray-700">Agent Fee</th>}

                  <th className="px-3 py-2 text-right font-medium text-gray-700 bg-blue-50/50">Monthly (MI)</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 bg-blue-50/50">Monthly OA</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 bg-blue-50/50">Cash Top-up</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 bg-green-50/50">CPF Runway</th>

                  <th className="px-3 py-2 text-right font-medium text-gray-700">Upfront Req.</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">{propertyType === 'HDB' && loanType === 'HDB' ? '80%' : '75%'} Loan</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Loan Shortfall</th>
                </tr>
              </thead>
              <tbody>
                {purchaseDetails.map((detail, index) => (
                  <tr
                    key={detail.price}
                    className={`border-b ${detail.canAfford ? 'bg-green-50' : ''} ${index % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                  >
                    <td className={`px-3 py-2 font-medium sticky left-0 ${detail.canAfford ? 'bg-green-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>{formatCurrency(detail.price)}</td>

                    <td className="px-3 py-2 text-right">{formatCurrency(detail.cashDeposit)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.cpfDeposit)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.bsd + detail.absd)}</td>
                    {propertyType === 'HDB' && <td className="px-3 py-2 text-right">{formatCurrency(detail.buyerAgentFee)}</td>}

                    <td className="px-3 py-2 text-right bg-blue-50/30 font-medium">{formatCurrency(Math.round(detail.monthlyInstalment))}</td>
                    <td className="px-3 py-2 text-right bg-blue-50/30">{formatCurrency(Math.round(detail.monthlyOA))}</td>
                    <td className={`px-3 py-2 text-right bg-blue-50/30 ${detail.cashTopUp > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                      {detail.cashTopUp > 0 ? formatCurrency(Math.round(detail.cashTopUp)) : '-'}
                    </td>
                    <td className={`px-3 py-2 text-right bg-green-50/30 ${detail.runwayYears < 30 ? 'text-orange-600' : 'text-green-600'}`}>
                      {detail.cashTopUp > 0
                        ? (detail.runwayYears > 50 ? '> 50 years' : `${detail.runwayYears.toFixed(1)} years`)
                        : '∞'}
                    </td>

                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(detail.upfrontRequired)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(detail.loanLTV)}</td>
                    <td className={`px-3 py-2 text-right ${detail.loanShortfall > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      {detail.loanShortfall > 0 ? formatCurrency(detail.loanShortfall) : '-'}
                    </td>
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
              <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: 'rgb(234 88 12 / 0.1)' }}></span>
              <span>Orange values = additional requirements when there's a loan shortfall</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

export default App
