# Budget Plan LaTeX Compilation Guide

## Quick Compilation Options

### Option 1: Online LaTeX Compiler (Easiest)
1. Go to [Overleaf](https://www.overleaf.com) (free account)
2. Create a new project
3. Upload `BUDGET_PLAN.tex`
4. Click "Recompile" to generate PDF
5. Download the PDF for printing

### Option 2: Install LaTeX Locally (macOS)
```bash
# Install MacTeX (full LaTeX distribution)
brew install --cask mactex

# Or install BasicTeX (smaller, ~100MB)
brew install --cask basictex

# After installation, compile:
pdflatex BUDGET_PLAN.tex
pdflatex BUDGET_PLAN.tex  # Run twice for references
```

### Option 3: Use Docker
```bash
# Run LaTeX in Docker container
docker run --rm -v "$PWD":/workdir texlive/texlive:latest pdflatex BUDGET_PLAN.tex
```

## What's Included in the Budget Plan

The budget plan includes:

1. **Development Tools Costs**
   - Cursor AI subscription (individual, team, enterprise)
   - Annual costs for different team sizes

2. **Cloud Infrastructure Costs**
   - Vercel hosting (Hobby, Pro, Enterprise)
   - Supabase database (Free, Pro, Team, Enterprise)
   - Bandwidth and usage costs

3. **Personnel Costs**
   - Developer salaries (Sri Lankan market rates)
   - Team compositions for 5, 20, and 50 developers
   - Junior, Mid-level, Senior, and Tech Lead rates

4. **Development Phases**
   - Initial development (6 months)
   - Deployment phase (1 month)
   - Maintenance and bug fixes (annual)

5. **Total Cost Analysis**
   - First year costs by team size
   - Annual operating costs (Year 2+)
   - Monthly cost breakdowns

6. **Profit Margin Analysis**
   - Costs with 0% to 100% profit margins
   - Pricing recommendations

7. **Cost Breakdowns**
   - Percentage distribution by category
   - Hidden costs and considerations
   - Cost optimization strategies

## Development Timeline: 2 months and 15 days (2.5 months)

## Key Figures (Small Team - 5 developers)

- **Development Phase (2.5 months)**: 5,116,125 LKR
- **First Year Total**: 11,934,825 LKR
- **Annual Operating (Year 2+)**: 25,897,400 LKR
- **Monthly Operating**: 1,991,450 LKR

## Key Figures (Medium Team - 20 developers)

- **Development Phase (2.5 months)**: 13,146,125 LKR
- **First Year Total**: 28,797,525 LKR
- **Annual Operating (Year 2+)**: 66,201,400 LKR
- **Monthly Operating**: 5,100,450 LKR

## Key Figures (Large Team - 50 developers)

- **Development Phase (2.5 months)**: 31,731,125 LKR
- **First Year Total**: 66,205,825 LKR
- **Annual Operating (Year 2+)**: 158,509,400 LKR
- **Monthly Operating**: 12,375,450 LKR

## Notes

- **Development Timeline**: 2 months and 15 days (2.5 months)
- All costs are in Sri Lankan Rupees (LKR)
- Exchange rate used: 1 USD = 320 LKR
- Costs are estimates based on Sri Lankan market rates
- Actual costs may vary based on negotiations and usage
- The 2.5-month development timeline reduces first-year costs by approximately 30-33% compared to a 6-month development cycle
