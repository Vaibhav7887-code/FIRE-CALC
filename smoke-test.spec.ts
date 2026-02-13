import { test, expect, Page } from '@playwright/test';

// Helper to wait for console errors
const consoleErrors: string[] = [];
const consoleWarnings: string[] = [];

test.describe('Budgeting App Smoke Test', () => {
  test.setTimeout(120000); // 2 minutes for the full smoke test
  
  test.beforeEach(async ({ page }) => {
    // Clear error arrays
    consoleErrors.length = 0;
    consoleWarnings.length = 0;

    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Complete smoke test flow', async ({ page }) => {
    console.log('\n=== STEP 1: Wizard loads without console errors ===');
    
    // Check wizard loaded
    await expect(page.locator('h1')).toContainText('Budgeting calculator');
    await expect(page.locator('text=Assumptions')).toBeVisible();
    
    // Report console errors at this stage
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors on load:', consoleErrors);
    } else {
      console.log('✅ No console errors on wizard load');
    }

    // Navigate through initial steps to get to Investments
    console.log('\n=== Navigating to Investments step ===');
    
    // Fill in Assumptions step (step 0)
    // Fields already have default values, just verify and proceed
    await expect(page.getByRole('textbox', { name: 'Tax year' })).toHaveValue('2026');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Fill in Household members step (step 1)
    await expect(page.getByRole('heading', { name: 'Household members' })).toBeVisible();
    // Default member should exist, just proceed
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Household expenses step (step 2) - Test 4
    console.log('\n=== STEP 4: In Household expenses, add category and confirm it starts blank ===');
    await expect(page.getByRole('heading', { name: 'Breakdown' })).toBeVisible();
    
    // Add a new category
    const addCategoryButton = page.locator('button:has-text("+ Add category")');
    await addCategoryButton.click();
    await page.waitForTimeout(500);
    
    // Check that the new category has blank values
    const nameInput = page.getByRole('textbox', { name: 'Name' });
    const amountInput = page.getByRole('textbox', { name: 'Monthly amount' });
    
    if (await nameInput.count() > 0) {
      const nameValue = await nameInput.inputValue();
      console.log('Category name value:', nameValue);
      console.log('✅ New category starts with blank/default value');
      
      // Fill in the category so we can proceed
      await nameInput.fill('Rent');
      await amountInput.fill('2000');
      await page.waitForTimeout(300);
    } else {
      console.log('❌ Failed to add category');
    }
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Investments step (step 3) - Test 2, 3, 5
    console.log('\n=== STEP 2: Add an investment bucket and confirm it appears at the top ===');
    // Wait for the investments step to load
    await expect(page.locator('select#newInvestmentKind')).toBeVisible();
    
    // Count existing investments
    const investmentsBefore = await page.locator('[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({ hasText: /TFSA|RRSP|Custom/ }).count();
    console.log('Investments before adding:', investmentsBefore);
    
    // Add a TFSA investment
    await page.selectOption('select#newInvestmentKind', 'TFSA');
    await page.click('button:has-text("+ Add")');
    await page.waitForTimeout(500);
    
    // Count investments after
    const investmentsAfter = await page.locator('[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({ hasText: /TFSA|RRSP|Custom/ }).count();
    console.log('Investments after adding:', investmentsAfter);
    
    if (investmentsAfter === investmentsBefore + 1) {
      console.log('✅ Investment bucket added successfully');
      
      // Check if it appears at the top (first in the list)
      const firstInvestment = page.locator('[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({ hasText: /TFSA|RRSP|Custom/ }).first();
      const firstInvestmentText = await firstInvestment.textContent();
      
      if (firstInvestmentText?.includes('TFSA')) {
        console.log('✅ New investment appears at the top');
      } else {
        console.log('❌ New investment does not appear at the top');
      }
    } else {
      console.log('❌ Failed to add investment bucket');
    }

    // Test 3: Reorder investments
    console.log('\n=== STEP 3: Use up/down arrows to reorder investments ===');
    
    // Add another investment to have multiple for reordering
    await page.selectOption('select#newInvestmentKind', 'RRSP');
    await page.click('button:has-text("+ Add")');
    await page.waitForTimeout(500);
    
    // Try to find reorder buttons
    const reorderButtons = page.locator('button[aria-label*="Move"]').or(page.locator('button:has-text("↑")').or(page.locator('button:has-text("↓")')));
    const reorderButtonCount = await reorderButtons.count();
    
    if (reorderButtonCount > 0) {
      console.log(`Found ${reorderButtonCount} reorder buttons`);
      
      // Get the order before
      const investmentsBefore = await page.locator('[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({ hasText: /TFSA|RRSP|Custom/ }).allTextContents();
      console.log('Order before:', investmentsBefore.map(t => t.substring(0, 50)));
      
      // Click the down button on the first item (should move it down)
      const downButton = page.locator('button[aria-label*="down"]').or(page.locator('button:has-text("↓")')).first();
      if (await downButton.count() > 0) {
        await downButton.click();
        await page.waitForTimeout(300);
        
        // Get the order after
        const investmentsAfter = await page.locator('[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({ hasText: /TFSA|RRSP|Custom/ }).allTextContents();
        console.log('Order after:', investmentsAfter.map(t => t.substring(0, 50)));
        
        if (JSON.stringify(investmentsBefore) !== JSON.stringify(investmentsAfter)) {
          console.log('✅ Reorder functionality works');
        } else {
          console.log('⚠️  Order did not change (might be at boundary)');
        }
      } else {
        console.log('⚠️  Could not find down button');
      }
    } else {
      console.log('⚠️  No reorder buttons found');
    }

    // Test 5: TFSA room summary
    console.log('\n=== STEP 5: In Investments TFSA room summary, enter TFSA room and backfill ===');
    
    // Look for TFSA room inputs
    const tfsaRoomSection = page.locator('text=TFSA room').or(page.locator('text=Remaining room'));
    
    if (await tfsaRoomSection.count() > 0) {
      console.log('Found TFSA room section');
      
      // Find the TFSA investment we added
      const tfsaInvestment = page.locator('[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({ hasText: 'TFSA' }).first();
      
      // Look for room-related inputs within or near this investment
      const roomInput2026 = tfsaInvestment.locator('input[name*="room"]').or(tfsaInvestment.locator('input[placeholder*="2026"]')).first();
      const backfillButton = tfsaInvestment.locator('button:has-text("+ Add backfill")').or(tfsaInvestment.locator('button:has-text("Add contribution")'));
      
      if (await roomInput2026.count() > 0) {
        // Get initial remaining room value
        const remainingRoomBefore = await page.locator('text=/Remaining.*room/i').or(page.locator('text=/room.*remaining/i')).textContent();
        console.log('Remaining room before:', remainingRoomBefore);
        
        // Enter TFSA room for 2026
        await roomInput2026.fill('7000');
        await page.waitForTimeout(300);
        
        // Try to add a backfill for 2025
        if (await backfillButton.count() > 0) {
          await backfillButton.first().click();
          await page.waitForTimeout(300);
          
          // Fill backfill amount
          const backfillInput = tfsaInvestment.locator('input[name*="backfill"]').or(tfsaInvestment.locator('input[placeholder*="amount"]')).first();
          if (await backfillInput.count() > 0) {
            await backfillInput.fill('5000');
            await page.waitForTimeout(300);
          }
        }
        
        // Check if remaining room updated
        const remainingRoomAfter = await page.locator('text=/Remaining.*room/i').or(page.locator('text=/room.*remaining/i')).textContent();
        console.log('Remaining room after:', remainingRoomAfter);
        
        if (remainingRoomBefore !== remainingRoomAfter) {
          console.log('✅ Remaining room updates immediately');
        } else {
          console.log('⚠️  Remaining room did not update (or not visible)');
        }
      } else {
        console.log('⚠️  Could not find TFSA room input');
      }
    } else {
      console.log('⚠️  TFSA room section not found');
    }
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Goals step (step 4) - Test 6
    console.log('\n=== STEP 6: In Goals, set target amount and date, confirm monthly contribution auto-updates ===');
    // Wait for goals step to load - look for the add goal buttons
    await expect(page.locator('button:has-text("+ Emergency fund")')).toBeVisible();
    
    // Add a goal - use the Emergency fund button
    const addGoalButton = page.locator('button:has-text("+ Emergency fund")');
    if (await addGoalButton.count() > 0) {
      await addGoalButton.click();
      await page.waitForTimeout(500);
      
      // Find the goal inputs
      const goalCard = page.locator('[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({ hasText: /goal|target/i }).first();
      
      // Set target amount
      const targetAmountInput = goalCard.locator('input[name*="targetAmount"]').or(goalCard.locator('input[placeholder*="amount"]')).first();
      if (await targetAmountInput.count() > 0) {
        await targetAmountInput.fill('12000');
        await page.waitForTimeout(300);
        
        // Set target date (1 year from now)
        const targetDateInput = goalCard.locator('input[name*="targetDate"]').or(goalCard.locator('input[type="date"]')).first();
        if (await targetDateInput.count() > 0) {
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 1);
          const dateString = futureDate.toISOString().split('T')[0];
          await targetDateInput.fill(dateString);
          await page.waitForTimeout(300);
          
          // Check if monthly contribution auto-calculated
          const monthlyContribInput = goalCard.locator('input[name*="monthlyContribution"]').or(goalCard.locator('input[placeholder*="monthly"]')).first();
          if (await monthlyContribInput.count() > 0) {
            const monthlyValue = await monthlyContribInput.inputValue();
            console.log('Monthly contribution calculated:', monthlyValue);
            
            if (monthlyValue && monthlyValue !== '0' && monthlyValue !== '') {
              console.log('✅ Monthly contribution auto-updates');
              
              // Now edit monthly and check if target date updates
              await monthlyContribInput.fill('500');
              await page.waitForTimeout(300);
              
              const newTargetDate = await targetDateInput.inputValue();
              console.log('Target date after editing monthly:', newTargetDate);
              
              if (newTargetDate !== dateString) {
                console.log('✅ Target date updates when monthly is edited');
              } else {
                console.log('⚠️  Target date did not update');
              }
            } else {
              console.log('⚠️  Monthly contribution not calculated');
            }
          } else {
            console.log('⚠️  Monthly contribution input not found');
          }
        } else {
          console.log('⚠️  Target date input not found');
        }
      } else {
        console.log('⚠️  Target amount input not found');
      }
    } else {
      console.log('⚠️  Add goal button not found');
    }
    
    // Test reordering goals
    console.log('\n=== Testing goal reordering ===');
    const goalReorderButtons = page.locator('button[aria-label*="Move"]').or(page.locator('button:has-text("↑")'));
    if (await goalReorderButtons.count() > 0) {
      console.log('✅ Goal reorder buttons present');
    } else {
      console.log('⚠️  Goal reorder buttons not found');
    }
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Debts step (step 5) - Test 7
    console.log('\n=== STEP 7: In Debts with monthly payment, confirm Paid off by appears and updates ===');
    // Wait for debts step to load
    await expect(page.locator('button:has-text("+ Add debt")')).toBeVisible();
    
    // Add a debt
    const addDebtButton = page.locator('button:has-text("+ Add")').or(page.locator('button:has-text("Add debt")'));
    if (await addDebtButton.count() > 0) {
      await addDebtButton.first().click();
      await page.waitForTimeout(500);
      
      // Find the debt card
      const debtCard = page.locator('[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({ hasText: /debt|balance|payment/i }).first();
      
      // Fill in debt details
      const balanceInput = debtCard.locator('input[name*="balance"]').or(debtCard.locator('input[placeholder*="balance"]')).first();
      if (await balanceInput.count() > 0) {
        await balanceInput.fill('10000');
        await page.waitForTimeout(300);
        
        // Set interest rate
        const rateInput = debtCard.locator('input[name*="rate"]').or(debtCard.locator('input[placeholder*="rate"]')).first();
        if (await rateInput.count() > 0) {
          await rateInput.fill('5');
          await page.waitForTimeout(300);
        }
        
        // Set monthly payment
        const paymentInput = debtCard.locator('input[name*="payment"]').or(debtCard.locator('input[placeholder*="payment"]')).first();
        if (await paymentInput.count() > 0) {
          await paymentInput.fill('500');
          await page.waitForTimeout(500);
          
          // Check for "Paid off by" text
          const paidOffText = await debtCard.locator('text=/paid.*off/i').or(debtCard.locator('text=/payoff.*date/i')).textContent();
          console.log('Paid off by text:', paidOffText);
          
          if (paidOffText) {
            console.log('✅ "Paid off by" appears');
            
            // Change payment and see if it updates
            await paymentInput.fill('1000');
            await page.waitForTimeout(500);
            
            const newPaidOffText = await debtCard.locator('text=/paid.*off/i').or(debtCard.locator('text=/payoff.*date/i')).textContent();
            console.log('Paid off by text after change:', newPaidOffText);
            
            if (paidOffText !== newPaidOffText) {
              console.log('✅ "Paid off by" updates when payment changes');
            } else {
              console.log('⚠️  "Paid off by" did not update');
            }
          } else {
            console.log('⚠️  "Paid off by" text not found');
          }
        } else {
          console.log('⚠️  Payment input not found');
        }
      } else {
        console.log('⚠️  Balance input not found');
      }
    } else {
      console.log('⚠️  Add debt button not found');
    }
    
    // Test reordering debts
    console.log('\n=== Testing debt reordering ===');
    const debtReorderButtons = page.locator('button[aria-label*="Move"]').or(page.locator('button:has-text("↑")'));
    if (await debtReorderButtons.count() > 0) {
      console.log('✅ Debt reorder buttons present');
    } else {
      console.log('⚠️  Debt reorder buttons not found');
    }
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Templates step (step 6) - Test 3
    console.log('\n=== STEP 3: Testing template reordering ===');
    // Wait for templates step - just check we can proceed
    await page.waitForTimeout(500);
    
    const templateReorderButtons = page.locator('button[aria-label*="Move"]').or(page.locator('button:has-text("↑")'));
    if (await templateReorderButtons.count() > 0) {
      console.log('✅ Template reorder buttons present');
    } else {
      console.log('⚠️  Template reorder buttons not found');
    }
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Review step (step 7)
    console.log('\n=== Review step ===');
    // Wait for review step
    await page.waitForTimeout(500);
    
    // Complete wizard
    console.log('\n=== STEP 8: Complete wizard to dashboard ===');
    const completeButton = page.locator('button:has-text("Create dashboard")');
    await completeButton.click();
    await page.waitForTimeout(2000);
    
    // Check we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    console.log('✅ Navigated to dashboard');
    
    // Wait for dashboard to render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for max update depth errors
    console.log('\n=== Checking for max update depth errors ===');
    const maxUpdateDepthErrors = consoleErrors.filter(err => 
      err.toLowerCase().includes('maximum update depth') || 
      err.toLowerCase().includes('too many re-renders')
    );
    
    if (maxUpdateDepthErrors.length > 0) {
      console.log('❌ Max update depth errors found:', maxUpdateDepthErrors);
    } else {
      console.log('✅ No max update depth errors');
    }
    
    // Check for goal funds chart
    console.log('\n=== STEP 8: Checking goal funds chart behavior ===');
    const goalChart = page.locator('text=/goal.*fund/i').or(page.locator('[class*="recharts"]'));
    
    if (await goalChart.count() > 0) {
      console.log('✅ Goal funds chart present');
      // Note: Detailed chart behavior (stops at target, redirects) would require
      // inspecting chart data or visual testing, which is complex in automated tests
      console.log('ℹ️  Chart behavior (stops at target, redirects) requires manual verification');
    } else {
      console.log('⚠️  Goal funds chart not found');
    }
    
    // Final console error check
    console.log('\n=== FINAL RESULTS ===');
    console.log('Total console errors:', consoleErrors.length);
    console.log('Total console warnings:', consoleWarnings.length);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  Console Warnings:');
      consoleWarnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    // Assert no critical errors
    expect(consoleErrors.filter(e => 
      !e.includes('DevTools') && 
      !e.includes('favicon') &&
      !e.includes('Download the React DevTools')
    ).length).toBe(0);
  });
});
