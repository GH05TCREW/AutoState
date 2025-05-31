# AutoState

**Natural Language → FSM → Code**

AutoState is an AI-powered tool that converts natural language scenarios into finite state machines (FSMs) and generates production-ready code. Perfect for security systems, safety protocols, workflow automation, and embedded systems.

<img width="932" alt="Screenshot 2025-05-30 071858" src="https://github.com/user-attachments/assets/66d848c4-fada-4b2f-92c9-c290841ab020" />

## Key Features

### **AI Parsing**
- Convert plain English scenarios into formal FSM transitions
- GPT-4o integration for intelligent state extraction
- Human-in-the-loop workflow with AI suggestions

### **Visualization**
- **Multiple Layout Algorithms**: Hierarchical, Tree, Force-Directed, Circular
- **Interactive Controls**: Zoom, pan, fit-to-view with animations
- **Smart Label Abbreviation**: Transition labels
- **Export Capabilities**: Download diagrams as PNG images

### **Verification & Analysis**
- Determinism checking (no conflicting transitions)
- Completeness analysis (missing state handlers)
- Reachability verification (detect unreachable states)
- Security pattern validation

### **Code Generation**
- **Python Classes**: Object-oriented FSM with unit tests
- **YAML Policies**: For RBAC and configuration management
- **C State Machines**: For embedded and real-time systems
- **Template-based**: Customizable output formats

<img width="922" alt="Screenshot 2025-05-30 064053" src="https://github.com/user-attachments/assets/230cbb3c-4706-46e6-bcf7-6d186919bd63" />

## Use Cases

- **Business Process Automation** - Approval workflows, document routing
- **Security Systems** - Access control, authentication flows
- **Industrial Control** - Manufacturing processes, safety interlocks  
- **Embedded Systems** - Device state management, protocol implementation
- **Game Logic** - Character states, game progression
- **User Interfaces** - Form validation, navigation flows

## Quick Start

### Prerequisites
- **Backend**: Python 3.8+, OpenAI API key
- **Frontend**: Node.js 16+, npm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/GH05TCREW/autostate.git
cd autostate
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_api_key_here" > .env
echo "DATABASE_URL=sqlite:///./autostate.db" >> .env
echo "SECRET_KEY=your_secret_key_here" >> .env
echo "ENVIRONMENT=development" >> .env

# Start backend
python main.py
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Usage Guide

### 1. **Create Scenarios**
Write natural language descriptions of your system behavior:

```
Given the system is idle, when the start button is pressed, then initialize the system and transition to running state
Given the system is running, when an error occurs, then log the error and transition to error state  
Given the system is in error state, when reset is pressed, then clear errors and transition to idle state
```

### 2. **Generate FSM**
Click "Generate FSM" to create the state machine. The AI will:
- Extract states, events, and actions
- Create transition table
- Build visual graph
- Suggest completeness improvements

### 3. **Review & Optimize**
- **Visual Graph**: Use layout controls for best view
  - **Hierarchical**: Perfect for workflows and processes
  - **Tree**: Great for decision trees and branching logic
  - **Force-Directed**: Shows natural relationships
  - **Circular**: Highlights cyclic patterns
- **Interactive Controls**: Zoom, pan, export diagrams
- **Edit Transitions**: Modify directly in the table
- **AI Suggestions**: Accept/reject proposed improvements

### 4. **Verify Completeness**
Run automated checks:
- ✅ **Deterministic**: No conflicting transitions
- ✅ **Complete**: All states handle necessary events  
- ✅ **Reachable**: No orphaned states
- ⚠️ **Warnings**: Potential issues and suggestions

### 5. **Generate Code**
Export your FSM as production-ready code:

**Python Example:**
```python
class SystemStateMachine:
    def __init__(self):
        self.current_state = State.IDLE
        
    def handle_event(self, event):
        # Generated transition logic
        if self.current_state == State.IDLE and event == Event.START_BUTTON:
            self.initialize_system()
            self.current_state = State.RUNNING
            return True
        # ... more transitions
```

## Visualization Features

### **Smart Layout Algorithms**
- **Hierarchical (Default)**: Left-to-right flow, perfect for sequential processes
- **Tree**: Top-down branching, ideal for decision trees
- **Force-Directed**: Physics-based positioning, shows natural clusters
- **Circular**: Radial layout, great for highlighting cycles

### **Interactive Controls**
- **Zoom In/Out**: Detailed inspection or overview
- **Fit to View**: Auto-center and scale diagram
- **Export PNG**: High-quality images for documentation
- **Smart Labels**: Abbreviated text prevents overlap

### **Styling**
- Color-coded elements (blue=initial, green=user, orange=AI)
- Curved edges with proper routing
- Drop shadows and professional typography
- Responsive layout with hover tooltips

## Example Scenarios

### **Door Access Control**
```
Given the door is locked, when valid keycard is presented, then unlock door and log access
Given the door is unlocked, when timeout occurs, then lock door automatically  
Given the door is locked, when invalid keycard is presented, then remain locked and alert security
Given the door is unlocked, when manual lock pressed, then lock door immediately
```

### **Order Processing**
```
Given order is submitted, when payment is valid, then confirm order and start processing
Given order is processing, when items are ready, then ship order and notify customer
Given order is shipped, when delivered, then complete order and request feedback
Given order is processing, when item unavailable, then refund payment and cancel order
```

### **Device State Management**
```
Given device is off, when power button pressed, then boot system and enter ready state
Given device is ready, when start command received, then begin operation and enter active state
Given device is active, when error detected, then stop operation and enter fault state
Given device is fault, when reset command received, then clear errors and enter ready state
```

## Architecture

```
┌────────────────────────────────────┐
│  Frontend (React + TypeScript)     │
│  • Scenario Editor                 │
│  • FSM Visualization               │
│  • Interactive Graph Controls      │
│  • Code Generator Interface        │
└──────────────┬─────────────────────┘
               │ API
┌──────────────▼──────────────────────┐
│  Backend (FastAPI + Python)         │
│  • LLM Parser (OpenAI GPT-4o)       │
│  • FSM Builder (NetworkX)           │
│  • Code Generator (Jinja2)          │
│  • Verification Engine              │
│  • SQLite Database                  │
└─────────────────────────────────────┘
```

### **Core Components**

- **LLM Parser**: Converts natural language to structured transitions
- **FSM Builder**: Constructs and validates state machines  
- **Visualization Engine**: Advanced graph rendering with vis-network
- **Verification Engine**: Completeness and correctness checking
- **Code Generator**: Multi-language template-based generation
- **Database Layer**: SQLAlchemy ORM with SQLite

## API Endpoints

### **Scenarios**
- `POST /api/scenarios/parse` - Parse natural language into FSM
- `GET /api/scenarios/{id}` - Retrieve FSM by ID
- `DELETE /api/scenarios/{id}` - Delete FSM

### **FSM Management**  
- `POST /api/fsm/{id}/suggest-transitions` - Get AI improvement suggestions
- `POST /api/fsm/{id}/accept-transition` - Accept suggested transition
- `PUT /api/fsm/{id}/transitions` - Update all transitions

### **Verification**
- `GET /api/verification/{id}/verify` - Run completeness checks
- `POST /api/verification/{id}/simulate` - Simulate event sequences
- `GET /api/verification/{id}/graph` - Get visualization data

### **Code Generation**
- `POST /api/generator/generate` - Generate code from FSM
- `POST /api/generator/download/{id}/{template}` - Download code file


## License

MIT License


