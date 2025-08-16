# CSV File Upload Logic Analysis

## 📋 File Upload Flow Overview

The CSV collection upload functionality follows a complex multi-step process:

```
User File Input → File Validation → CSV Parsing → Card Matching → Database Upload → Results Summary
```

---

## 🔄 Detailed Upload Flow

### 1. **File Input Handling**
```typescript
// Two entry points for file uploads:

// A) File input click
const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
};

// B) Drag & drop
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
};
```

### 2. **File Validation & Processing**
```typescript
const handleFile = async (file: File) => {
  // Step 1: File type validation
  if (!file.name.toLowerCase().endsWith('.csv')) {
    setErrorMessage('Please select a CSV file');
    setUploadStatus('error');
    return;
  }

  // Step 2: Initialize parsing state
  setUploadStatus('parsing');
  setProgress(10);
  setErrorMessage('');

  // Step 3: Parse CSV with Papa.parse
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (result) => { /* ... */ },
    error: (error) => { /* ... */ }
  });
};
```

### 3. **CSV Parsing & Data Processing**
```typescript
// Inside Papa.parse complete callback:
const data = result.data as CardsphereCSVRow[];

// Validate data exists
if (data.length === 0) {
  throw new Error('CSV file appears to be empty or invalid');
}

// Parse each row to standardized format
const parsedCards = data.map(parseCSVRow).filter(card => card.name);

if (parsedCards.length === 0) {
  throw new Error('No valid card data found in CSV');
}
```

### 4. **Card Row Parsing Logic**
```typescript
const parseCSVRow = (row: CardsphereCSVRow): ParsedCard => {
  // Handle multiple column name formats
  const name = row.Name || row.name || '';
  const setCode = row.Set || row.set || '';
  const setName = row['Set Name'] || row.set_name || '';
  const quantity = parseInt(row.Quantity || row.quantity || '1');
  const condition = normalizeCondition(row.Condition || row.condition || 'Near Mint');
  
  // Parse foil status (multiple formats)
  const foil = (row.Foil || row.foil || '').toLowerCase() === 'true' || 
               (row.Foil || row.foil || '').toLowerCase() === 'yes' ||
               (row.Foil || row.foil || '') === '1';
               
  const price = parseFloat(row.Price || row.price || '0') || undefined;

  return {
    name: name.trim(),
    setCode: setCode.trim(),
    setName: setName.trim(),
    quantity: isNaN(quantity) ? 1 : quantity,
    condition,
    foil,
    price
  };
};
```

### 5. **Database Card Matching**
```typescript
const matchCardsToDatabase = async (parsedCards: ParsedCard[]): Promise<MatchResult[]> => {
  const results: MatchResult[] = [];
  
  for (let i = 0; i < parsedCards.length; i++) {
    const card = parsedCards[i];
    
    // Update progress (40-60%)
    setProgress(40 + (i / parsedCards.length) * 20);
    
    try {
      // Build search parameters
      const searchParams = new URLSearchParams({
        name: card.name,
        ...(card.setCode && { setCode: card.setCode }),
        ...(card.setName && { setName: card.setName })
      });

      // API call to search for card
      const response = await fetch(`/api/cards/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.ok && data.data && data.data.length > 0) {
        // Use first match (most relevant)
        const match = data.data[0];
        results.push({
          parsed: card,
          matched: {
            uuid: match.uuid,
            name: match.name,
            setCode: match.set_code,
            setName: match.set_name
          }
        });
      } else {
        // No match found
        results.push({
          parsed: card,
          error: 'Card not found in database'
        });
      }
    } catch (error) {
      // Search error
      results.push({
        parsed: card,
        error: `Error searching for card: ${error.message}`
      });
    }
  }
  
  return results;
};
```

### 6. **Collection Upload**
```typescript
const uploadToCollection = async (matchedResults: MatchResult[]) => {
  // Transform matched results to collection format
  const cards = matchedResults.map(result => ({
    uuid: result.matched!.uuid,
    quantity: result.parsed.quantity,
    condition: result.parsed.condition,
    foil: result.parsed.foil,
    purchase_price: result.parsed.price,
    purchase_date: new Date().toISOString().split('T')[0]
  }));

  // POST to portfolio API
  const response = await fetch('/api/portfolio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      cards
    })
  });

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.error || 'Failed to add cards to collection');
  }
};
```

### 7. **Results & Summary**
```typescript
// Calculate final summary
const matched = matchResults.filter(r => r.matched).length;
const unmatched = matchResults.filter(r => !r.matched && !r.error).length;
const errors = matchResults.filter(r => r.error).length;

setSummary({
  total: matchResults.length,
  matched,
  unmatched,
  errors
});

// Complete the process
setProgress(100);
setUploadStatus('complete');
onUploadComplete();
```

---

## 🚨 Identified Issues in File Upload Logic

### **1. Testing Environment Problems**

#### **Issue: File Validation Not Triggering**
```typescript
// Problem: userEvent.upload() in tests may not trigger file validation
const file = new File(['content'], 'document.txt', { type: 'text/plain' });
await userEvent.upload(fileInput, file);
// File validation should show error but doesn't in test environment
```

#### **Root Cause:**
- JSDOM environment may not fully simulate file input behavior
- File name vs MIME type validation differences in test vs browser
- Event propagation issues in testing library

### **2. Async Timing Issues**

#### **Issue: Papa.parse Completion Timing**
```typescript
Papa.parse(file, {
  complete: async (result) => {
    // This async callback creates timing issues in tests
    // Tests may not wait long enough for completion
  }
});
```

#### **Root Cause:**
- Papa.parse uses setTimeout internally (0ms delay)
- Test assertions happen before async completion
- No reliable way to wait for Papa.parse in test environment

### **3. API Mock Misalignment**

#### **Issue: Response Format Mismatch**
```typescript
// Component expects:
if (data.ok && data.data && data.data.length > 0) { /* ... */ }

// Test mocks provide:
.mockResolvedValue({
  ok: true,
  json: () => Promise.resolve([...]) // Missing data wrapper
});
```

#### **Root Cause:**
- Test mocks don't match actual API response format
- Missing nested `data` property in mock responses
- Different error handling between mocked and real API calls

### **4. State Management Race Conditions**

#### **Issue: Rapid State Changes**
```typescript
setUploadStatus('parsing');   // State change 1
setProgress(10);              // State change 2
// ... Papa.parse async completion
setProgress(20);              // State change 3
setUploadStatus('matching');  // State change 4
```

#### **Root Cause:**
- Multiple state updates happen rapidly
- Tests may assert before state updates complete
- React state batching affects test timing

---

## 🔧 Recommended Fixes

### **1. Improve Test File Validation**
```typescript
// Add explicit file extension validation test
it('should validate file extension properly', () => {
  const component = render(<CSVCollectionUpload {...props} />);
  
  // Test both MIME type and extension validation
  const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
  const csvFile = new File(['content'], 'test.csv', { type: 'text/plain' }); // Wrong MIME, correct extension
  
  // Should reject .txt files
  // Should accept .csv files regardless of MIME type
});
```

### **2. Better Async Handling in Tests**
```typescript
// Use more reliable waiting strategies
it('should handle CSV parsing', async () => {
  const Papa = require('papaparse');
  
  Papa.parse.mockImplementation((file, options) => {
    // Use immediate callback for tests
    setImmediate(() => {
      options.complete({ data: mockData, errors: [] });
    });
  });
  
  // Wait for multiple state changes
  await waitFor(() => {
    expect(screen.getByText('Parsing CSV file...')).toBeInTheDocument();
  });
  
  await waitFor(() => {
    expect(screen.getByText('Matching cards to database...')).toBeInTheDocument();
  });
});
```

### **3. Fix API Mock Alignment**
```typescript
// Correct mock format matching actual API
(global.fetch as jest.Mock)
  .mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      ok: true,                    // ✅ Matches component expectation
      data: [{                     // ✅ Includes data wrapper
        uuid: 'test-uuid',
        name: 'Card Name',
        set_code: 'SET',
        set_name: 'Set Name'
      }],
      message: 'Success'
    })
  });
```

### **4. Add Debug Logging**
```typescript
// Add comprehensive logging for debugging
const handleFile = async (file: File) => {
  console.log('📁 File received:', { 
    name: file.name, 
    type: file.type, 
    size: file.size 
  });
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    console.log('❌ File validation failed: not a CSV file');
    setErrorMessage('Please select a CSV file');
    setUploadStatus('error');
    return;
  }
  
  console.log('✅ File validation passed');
  // Continue processing...
};
```

---

## 📊 File Upload Logic Summary

### **Strengths ✅**
- Comprehensive error handling at each step
- Flexible CSV format support (multiple column name variations)
- Progress tracking throughout the process
- Clean separation of concerns (parsing, matching, uploading)
- Proper async/await usage
- Good user feedback with status messages

### **Weaknesses ⚠️**
- Complex async flow difficult to test reliably
- Heavy dependency on external APIs for card matching
- Papa.parse callback timing issues in test environment
- No retry logic for failed API calls
- Limited batch processing optimization
- State management complexity with rapid updates

### **Test Environment Challenges 🧪**
- File upload simulation limitations in JSDOM
- Async timing coordination between Papa.parse and test assertions  
- API mock response format misalignment
- State update batching affects test predictability

The file upload logic is functionally robust but has several testing challenges that need targeted fixes for reliable test coverage.
