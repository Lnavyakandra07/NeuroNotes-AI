import { LectureWorkspace } from '../types/lecture';

export const SAMPLE_LECTURES: LectureWorkspace[] = [
  {
    id: 'lec_transformer_attention',
    title: 'Transformer Architecture & Scaled Dot-Product Attention',
    courseCode: 'CS 224N',
    instructor: 'Prof. Elena Vance',
    domain: 'Deep Learning & NLP',
    durationSec: 2780,
    sourceType: 'demo-slides',
    createdAt: '2026-10-14T10:30:00.000Z',
    summary:
      'Deconstructs why recurrent neural networks bottleneck sequence modeling and derives the multi-head scaled dot-product attention mechanism, variance stabilization via sqrt(d_k), and causal masking in PyTorch.',
    keyTakeaways: [
      'Self-attention achieves O(1) sequential path length between any two tokens, unlocking full GPU parallelization across sequence length T.',
      'Dividing dot products by sqrt(d_k) keeps pre-softmax variance at 1.0, preventing vanishing gradients in saturated softmax tails.',
      'Multi-head projection splits d_model into h independent subspaces so the model attends jointly to syntactic, coreference, and positional cues.',
      'Causal lower-triangular masking sets future attention logits to -infinity before softmax during autoregressive decoding.',
    ],
    slides: [
      {
        index: 0,
        startSec: 0,
        title: 'From Sequential RNN Bottlenecks to Parallel Attention',
        subtitle: 'Path length O(n) vs O(1) across token positions',
        visualType: 'attention-matrix',
        highlights: [
          'RNN hidden state h_t depends sequentially on h_{t-1}',
          'Gradient signal decays over long contexts',
          'Self-attention connects all pairs in one matrix multiply',
        ],
      },
      {
        index: 1,
        startSec: 495,
        title: 'Query, Key, and Value Subspace Projections',
        subtitle: 'Linear maps W_Q, W_K, W_V in R^{d_model x d_k}',
        visualType: 'attention-matrix',
        highlights: [
          'Queries represent what a token is looking for',
          'Keys advertise what each token contains',
          'Values carry the payload aggregated by weights',
        ],
        formulaLatex: 'Q = XW_Q,\\quad K = XW_K,\\quad V = XW_V',
      },
      {
        index: 2,
        startSec: 1120,
        title: 'Why Scale by 1 / sqrt(d_k)?',
        subtitle: 'Variance control before Softmax saturation',
        visualType: 'attention-matrix',
        highlights: [
          'If q, k ~ N(0,1), then Var(q · k) = d_k',
          'Large logits push softmax toward one-hot spikes',
          'Scaling restores unit variance regardless of head dimension',
        ],
        formulaLatex:
          '\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V',
      },
      {
        index: 3,
        startSec: 1840,
        title: 'Multi-Head Attention & Causal Masking',
        subtitle: 'Parallel attention heads concatenated & projected via W_O',
        visualType: 'attention-matrix',
        highlights: [
          'Each head operates on d_k = d_model / h dimensions',
          'Upper-triangle mask (-inf) prevents future token leakage',
          'Output projection W_O mixes cross-head representations',
        ],
        formulaLatex:
          '\\text{MHA}(Q,K,V) = \\text{Concat}(\\text{head}_1,\\dots,\\text{head}_h)W_O',
      },
    ],
    transcript: [
      {
        id: 't1',
        startSec: 0,
        endSec: 165,
        speaker: 'Prof. Vance',
        slideIndex: 0,
        tags: ['definition'],
        text: 'Welcome back. Today we leave recurrent networks behind and build the Transformer from first principles. Notice the fundamental flaw of LSTMs: computing hidden state h_t requires waiting for h_{t-1}, giving us O(T) sequential operations.',
      },
      {
        id: 't2',
        startSec: 166,
        endSec: 494,
        speaker: 'Prof. Vance',
        slideIndex: 0,
        tags: ['diagram'],
        text: 'Look at the architecture diagram on the slide. By replacing recurrence with pairwise token interaction, every token directly communicates with every other token in O(1) sequential steps, at the cost of O(T^2 · d) compute.',
      },
      {
        id: 't3',
        startSec: 495,
        endSec: 860,
        speaker: 'Prof. Vance',
        slideIndex: 1,
        tags: ['formula'],
        text: 'How do we compute this interaction? Given input embeddings X of shape (B, T, d_model), we project X into three distinct roles: Queries Q = X W_Q, Keys K = X W_K, and Values V = X W_V.',
      },
      {
        id: 't4',
        startSec: 861,
        endSec: 1119,
        speaker: 'Prof. Vance',
        slideIndex: 1,
        tags: ['definition'],
        text: 'Think of Keys and Values like a differentiable hash table. A query compares itself against all keys via dot product, producing compatibility scores, and then takes a weighted average of the values.',
      },
      {
        id: 't5',
        startSec: 1120,
        endSec: 1510,
        speaker: 'Prof. Vance',
        slideIndex: 2,
        tags: ['formula', 'diagram'],
        text: 'Now here is a detail students always overlook in exams: why divide QK^T by the square root of d_k? Suppose each component of q and k has zero mean and unit variance. Their dot product sums d_k independent products, so its variance grows linearly to d_k.',
      },
      {
        id: 't6',
        startSec: 1511,
        endSec: 1839,
        speaker: 'Prof. Vance',
        slideIndex: 2,
        tags: ['formula'],
        text: 'When d_k is 64 or 128, standard deviation is 8 to 11. Those large logits push softmax into regions with near-zero gradients. Dividing by sqrt(d_k) normalizes variance back to 1.0.',
      },
      {
        id: 't7',
        startSec: 1840,
        endSec: 2320,
        speaker: 'Prof. Vance',
        slideIndex: 3,
        tags: ['code'],
        text: 'Let us translate this directly into vectorized PyTorch code. We reshape (B, T, d_model) into (B, h, T, d_k), transpose the head and sequence dimensions, and compute masked scaled dot-product attention.',
      },
      {
        id: 't8',
        startSec: 2321,
        endSec: 2780,
        speaker: 'Prof. Vance',
        slideIndex: 3,
        tags: ['code', 'definition'],
        text: 'Notice how we apply masked_fill(mask == 0, float("-inf")) right before softmax—never after—so masked future positions contribute exact zero probability mass and zero gradient.',
      },
    ],
    notesMarkdown: `## 1. Breaking the Recurrent Bottleneck
Recurrent models process tokens sequentially, forcing $O(T)$ dependent steps where $h_t = f(h_{t-1}, x_t)$ [00:00]. Self-attention eliminates this sequential dependency by connecting every pair of positions in a single parallel matrix operation [02:46].

- **Maximum Path Length**: $O(1)$ between any two tokens, eliminating vanishing gradients over long contexts.
- **Computational Trade-off**: Attention matrix $QK^T$ costs $O(T^2 \\cdot d)$ memory and FLOPs, making context length quadratic unless flash/sparse kernels are used.

## 2. Query, Key, and Value Projections
Given input sequence tensor $X \\in \\mathbb{R}^{T \\times d_{\\text{model}}}$, each layer learns three projection matrices [08:15]:

$$Q = XW_Q, \\quad K = XW_K, \\quad V = XW_V$$

- **Query ($Q$)**: Represents what semantic or syntactic feature the current token is searching for.
- **Key ($K$)**: Advertises the identity/role of every candidate token in the sequence [14:21].
- **Value ($V$)**: Holds the contextual representation aggregated after softmax weighting.

## 3. Scaled Dot-Product Attention & Variance Proof
The canonical attention equation normalizes compatibility logits before applying softmax [18:40]:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

Why divide by $\\sqrt{d_k}$? If $q_i, k_i \\sim \\mathcal{N}(0, 1)$ independently, then [25:11]:

$$\\text{Var}\\left(\\sum_{i=1}^{d_k} q_i k_i\\right) = d_k \\implies \\text{Var}\\left(\\frac{q \\cdot k}{\\sqrt{d_k}}\\right) = 1$$

Without scaling, large $d_k$ pushes softmax into extreme saturation where $\\frac{\\partial \\text{softmax}}{\\partial z} \\approx 0$.

## 4. Vectorized Multi-Head Causal Attention
Splitting $d_{\\text{model}}$ into $h$ heads of dimension $d_k = d_{\\text{model}} / h$ allows simultaneous attention across distinct representation subspaces [30:40]. During autoregressive decoding, apply a lower-triangular mask **before** softmax [38:41]:

\`\`\`python
scores = (q @ k.transpose(-2, -1)) / math.sqrt(d_k)
if mask is not None:
    scores = scores.masked_fill(mask == 0, float("-inf"))
attn_weights = torch.softmax(scores, dim=-1)
\`\`\``,
    diagrams: [
      {
        id: 'diag_mha_flow',
        title: 'Multi-Head Scaled Dot-Product Attention Dataflow',
        timestampSec: 495,
        description:
          'End-to-end tensor transformations from input sequence X through parallel Q/K/V heads, causal masking, and output projection W_O.',
        mermaidCode: `flowchart TD
  X["Input Tensor X (B, T, d_model)"] --> LQ["Linear W_Q"]
  X --> LK["Linear W_K"]
  X --> LV["Linear W_V"]
  LQ --> SQ["Split h Heads (B, h, T, d_k)"]
  LK --> SK["Split h Heads (B, h, T, d_k)"]
  LV --> SV["Split h Heads (B, h, T, d_k)"]
  SQ --> MM["MatMul Q * K^T"]
  SK --> MM
  MM --> SC["Scale by 1 / sqrt(d_k)"]
  SC --> MK["Causal Mask (-inf upper triangle)"]
  MK --> SM["Softmax over last dim"]
  SM --> AV["MatMul Weights * V"]
  SV --> AV
  AV --> CT["Concat Heads (B, T, d_model)"]
  CT --> WO["Output Projection W_O"]`,
      },
      {
        id: 'diag_transformer_block',
        title: 'Pre-Norm Transformer Decoder Block',
        timestampSec: 1840,
        description:
          'Residual highway with LayerNorm placement prior to multi-head attention and feed-forward MLP layers.',
        mermaidCode: `flowchart LR
  IN["Hidden State h_l"] --> LN1["LayerNorm"]
  LN1 --> MHA["Causal Multi-Head Attention"]
  IN --> ADD1["Residual Add (+)"]
  MHA --> ADD1
  ADD1 --> LN2["LayerNorm"]
  LN2 --> FFN["Position-Wise FFN (GELU)"]
  ADD1 --> ADD2["Residual Add (+)"]
  FFN --> ADD2
  ADD2 --> OUT["Output State h_{l+1}"]`,
      },
    ],
    codeBlocks: [
      {
        id: 'code_mha_pytorch',
        title: 'MultiHeadAttention Module (PyTorch)',
        language: 'python',
        timestampSec: 1840,
        explanation:
          'Vectorized multi-head causal self-attention with head reshaping, sqrt(d_k) scaling, and pre-softmax -inf masking.',
        code: `import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0, "d_model must be divisible by num_heads"
        self.d_k = d_model // num_heads
        self.num_heads = num_heads

        self.w_q = nn.Linear(d_model, d_model, bias=False)
        self.w_k = nn.Linear(d_model, d_model, bias=False)
        self.w_v = nn.Linear(d_model, d_model, bias=False)
        self.w_o = nn.Linear(d_model, d_model, bias=False)
        self.drop = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, mask: torch.Tensor | None = None) -> torch.Tensor:
        B, T, C = x.shape
        q = self.w_q(x).view(B, T, self.num_heads, self.d_k).transpose(1, 2)
        k = self.w_k(x).view(B, T, self.num_heads, self.d_k).transpose(1, 2)
        v = self.w_v(x).view(B, T, self.num_heads, self.d_k).transpose(1, 2)

        scores = (q @ k.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float("-inf"))

        attn = self.drop(F.softmax(scores, dim=-1))
        out = (attn @ v).transpose(1, 2).contiguous().view(B, T, C)
        return self.w_o(out)`,
      },
      {
        id: 'code_causal_mask',
        title: 'Autoregressive Lower-Triangular Mask Builder',
        language: 'python',
        timestampSec: 2321,
        explanation:
          'Creates a broadcastable (1, 1, T, T) causal mask preventing token t from attending to positions > t.',
        code: `def build_causal_mask(seq_len: int, device: torch.device) -> torch.Tensor:
    # 1 = keep, 0 = mask future position
    tril = torch.tril(torch.ones((seq_len, seq_len), device=device))
    return tril.view(1, 1, seq_len, seq_len)`,
      },
    ],
    mathFormulas: [
      {
        id: 'math_sdpa',
        title: 'Scaled Dot-Product Attention',
        timestampSec: 1120,
        latex:
          '\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V',
        variables: [
          { symbol: 'Q \\in \\mathbb{R}^{T \\times d_k}', meaning: 'Query matrix of token search vectors' },
          { symbol: 'K \\in \\mathbb{R}^{T \\times d_k}', meaning: 'Key matrix of token descriptors' },
          { symbol: 'V \\in \\mathbb{R}^{T \\times d_v}', meaning: 'Value matrix of token payloads' },
          { symbol: '\\sqrt{d_k}', meaning: 'Standard deviation normalizer preventing softmax saturation' },
        ],
        intuition:
          'Computes a soft, differentiable content-based lookup across all tokens simultaneously while keeping pre-softmax logit variance invariant to head size.',
      },
      {
        id: 'math_variance',
        title: 'Dot-Product Variance Stabilization',
        timestampSec: 1511,
        latex:
          '\\mathbb{E}[q \\cdot k] = 0, \\quad \\text{Var}(q \\cdot k) = \\sum_{i=1}^{d_k} \\text{Var}(q_i)\\text{Var}(k_i) = d_k',
        variables: [
          { symbol: 'q_i, k_i', meaning: 'Independent i.i.d. components with mean 0 and variance 1' },
          { symbol: 'd_k', meaning: 'Per-head projection dimension (typically 64 or 128)' },
        ],
        intuition:
          'Because variance scales linearly with d_k, dividing by sqrt(d_k) scales standard deviation back to 1 so gradients remain well-conditioned.',
      },
    ],
    flashcards: [
      {
        id: 'fc_1',
        topic: 'Complexity & Parallelism',
        timestampSec: 166,
        front: 'What is the sequential path length and per-layer time complexity of self-attention for sequence length T and dimension d?',
        back: 'Sequential path length is O(1) (all tokens interact in parallel), while per-layer compute and memory complexity is O(T² · d) due to the T × T attention matrix QK^T.',
        hint: 'Compare O(T) in RNNs against matrix multiplication of (T, d) by (d, T).',
      },
      {
        id: 'fc_2',
        topic: 'Scaling Factor',
        timestampSec: 1120,
        front: 'Why does Scaled Dot-Product Attention divide QK^T by sqrt(d_k) instead of d_k?',
        back: 'The sum of d_k independent unit-variance products has variance d_k and standard deviation sqrt(d_k). Dividing by sqrt(d_k) restores unit variance (1.0), whereas dividing by d_k would shrink variance to 1/d_k.',
      },
      {
        id: 'fc_3',
        topic: 'Causal Masking',
        timestampSec: 2321,
        front: 'Why must masked positions be set to -infinity BEFORE softmax rather than zeroed AFTER softmax?',
        back: 'Setting logits to -inf ensures exp(-inf) = 0 so future tokens receive zero weight AND remaining unmasked probabilities still sum cleanly to 1.0.',
      },
      {
        id: 'fc_4',
        topic: 'Multi-Head Design',
        timestampSec: 1840,
        front: 'How does Multi-Head Attention preserve total parameter/FLOP budget compared to single-head attention?',
        back: 'Each of the h heads uses reduced dimension d_k = d_model / h, so h parallel attention passes cost roughly the same total FLOPs as one full-dimension head.',
      },
      {
        id: 'fc_5',
        topic: 'Role Separation',
        timestampSec: 495,
        front: 'In a cross-attention decoder layer, which tensors supply Q, K, and V?',
        back: 'Queries (Q) come from the decoder hidden states, while Keys (K) and Values (V) come from the encoder memory representations.',
      },
    ],
    quizQuestions: [
      {
        id: 'q1',
        difficulty: 'Core',
        timestampSec: 1511,
        question:
          'If each entry in q and k is drawn independently from N(0, 1) with d_k = 64, what is the standard deviation of the unscaled dot product q · k?',
        options: ['1.0', '8.0', '64.0', '0.125'],
        correctIndex: 1,
        explanation:
          'The variance of the sum of 64 unit-variance products is 64, so the standard deviation is sqrt(64) = 8.0. Dividing by sqrt(d_k) = 8 restores standard deviation to 1.0.',
      },
      {
        id: 'q2',
        difficulty: 'Applied',
        timestampSec: 2321,
        question:
          'In PyTorch causal self-attention, what happens if you apply scores.masked_fill(mask == 0, 0.0) instead of float("-inf") before softmax?',
        options: [
          'Future tokens still receive exp(0) = 1 weight and leak into current predictions',
          'Softmax throws a NaN division-by-zero runtime error',
          'PyTorch automatically converts 0.0 to -inf inside F.softmax',
          'Attention weights sum to less than 1.0',
        ],
        correctIndex: 0,
        explanation:
          'Since exp(0) = 1, setting masked logits to 0.0 assigns non-zero attention probability to future tokens, breaking autoregressive causality.',
      },
      {
        id: 'q3',
        difficulty: 'Deep',
        timestampSec: 1840,
        question:
          'Given batch size B=4, sequence length T=128, d_model=512, and num_heads=8, what is the shape of the attention weight matrix (attn) inside MultiHeadAttention?',
        options: [
          '(4, 128, 128)',
          '(4, 8, 128, 64)',
          '(4, 8, 128, 128)',
          '(4, 512, 512)',
        ],
        correctIndex: 2,
        explanation:
          'Multiplying Q of shape (B, h, T, d_k) = (4, 8, 128, 64) by K^T of shape (4, 8, 64, 128) produces attention weights of shape (4, 8, 128, 128).',
      },
      {
        id: 'q4',
        difficulty: 'Core',
        timestampSec: 166,
        question:
          'Which complexity advantage allows Transformers to train dramatically faster than RNNs on long sequences (up to hardware memory limits)?',
        options: [
          'O(1) memory footprint with respect to sequence length T',
          'O(1) sequential operations across sequence length T',
          'Elimination of matrix multiplications in the forward pass',
          'Linear O(T) self-attention attention-score computation',
        ],
        correctIndex: 1,
        explanation:
          'Self-attention connects all tokens in O(1) sequential steps, enabling massive parallelization across all T tokens during training.',
      },
    ],
  },
  {
    id: 'lec_raft_consensus',
    title: 'Raft Distributed Consensus & Log Replication Safety',
    courseCode: '6.824',
    instructor: 'Prof. Marcus Chen',
    domain: 'Distributed Systems',
    durationSec: 3130,
    sourceType: 'demo-slides',
    createdAt: '2026-10-18T14:00:00.000Z',
    summary:
      'Breaks down Raft leader election, randomized election timeouts to prevent split votes, AppendEntries consistency checks, and the Election Safety & Log Matching invariants.',
    keyTakeaways: [
      'Raft decomposes consensus into Leader Election, Log Replication, and Safety invariants.',
      'Logical Terms act as monotonically increasing Lamport clocks to detect stale leaders.',
      'Randomized election timeouts (150ms–300ms) resolve split-vote ties with high probability.',
      'A leader only commits entries from its own current term once replicated on a strict majority quorum.',
    ],
    slides: [
      {
        index: 0,
        startSec: 0,
        title: 'Replicated State Machines & Consensus',
        subtitle: 'Why split-brain networks break naive primary-backup',
        visualType: 'raft-consensus',
        highlights: [
          'Every non-faulty replica applies the same log in order',
          'Quorum intersection guarantees at least one overlapping node',
          'Strong Leader model simplifies log flow',
        ],
        formulaLatex: '|Q_1| + |Q_2| > N \\implies Q_1 \\cap Q_2 \\neq \\emptyset',
      },
      {
        index: 1,
        startSec: 780,
        title: 'Leader Election & Randomized Timeouts',
        subtitle: 'Follower -> Candidate -> Leader state transitions',
        visualType: 'raft-consensus',
        highlights: [
          'Term increments on every election attempt',
          'Nodes vote at most once per term (persisted to disk)',
          'Randomized timeout prevents perpetual split votes',
        ],
      },
      {
        index: 2,
        startSec: 1650,
        title: 'Log Replication & PrevLogIndex Consistency Check',
        subtitle: 'Appending entries and healing divergent follower logs',
        visualType: 'raft-consensus',
        highlights: [
          'Leader tracks nextIndex[] and matchIndex[] per peer',
          'AppendEntries verifies (prevLogIndex, prevLogTerm)',
          'Conflicting follower suffixes are overwritten by leader log',
        ],
      },
    ],
    transcript: [
      {
        id: 'rt1',
        startSec: 0,
        endSec: 420,
        speaker: 'Prof. Chen',
        slideIndex: 0,
        tags: ['definition'],
        text: 'Why did Ongaro and Ousterhout design Raft when Paxos already existed? Single-decree Paxos is concise, but Multi-Paxos leaves implementation details under-specified. Raft enforces a strong leader: all log entries flow strictly from leader to followers.',
      },
      {
        id: 'rt2',
        startSec: 421,
        endSec: 779,
        speaker: 'Prof. Chen',
        slideIndex: 0,
        tags: ['formula'],
        text: 'Notice the quorum math: in a cluster of N = 2f + 1 nodes, any majority quorum has size at least f + 1. Therefore any two quorums Q1 and Q2 must intersect in at least one server.',
      },
      {
        id: 'rt3',
        startSec: 780,
        endSec: 1290,
        speaker: 'Prof. Chen',
        slideIndex: 1,
        tags: ['diagram'],
        text: 'Let us trace the state machine diagram. Every server starts as a Follower. If its election timer expires without receiving a heartbeat, it increments currentTerm, votes for itself, transitions to Candidate, and broadcasts RequestVote RPCs.',
      },
      {
        id: 'rt4',
        startSec: 1291,
        endSec: 1649,
        speaker: 'Prof. Chen',
        slideIndex: 1,
        tags: ['code'],
        text: 'Look closely at the RequestVote handler: we only grant a vote if the candidate term is at least currentTerm, we have not voted in this term, and the candidate log is at least as up-to-date as ours.',
      },
      {
        id: 'rt5',
        startSec: 1650,
        endSec: 2450,
        speaker: 'Prof. Chen',
        slideIndex: 2,
        tags: ['code', 'diagram'],
        text: 'Once elected, the Leader sends AppendEntries RPCs containing prevLogIndex and prevLogTerm. If a follower lacks a matching entry at prevLogIndex, it rejects the RPC, and the leader decrements nextIndex for that follower until they agree.',
      },
      {
        id: 'rt6',
        startSec: 2451,
        endSec: 3130,
        speaker: 'Prof. Chen',
        slideIndex: 2,
        tags: ['definition', 'formula'],
        text: 'Crucial safety subtlety: a leader must never mark an entry from a previous term as committed purely by counting replicas! It only commits entries from its own current term by majority, which indirectly commits earlier entries via the Log Matching Property.',
      },
    ],
    notesMarkdown: `## 1. Strong Leader & Quorum Intersection
Raft models fault-tolerant storage as a **Replicated State Machine** [00:00]. All client writes go exclusively through the elected Leader. For a cluster of $N = 2f + 1$ nodes tolerating $f$ crash faults [07:01]:

$$|Q_{\\text{elec}}| + |Q_{\\text{commit}}| \\ge (f + 1) + (f + 1) = N + 1 > N$$

Thus every newly elected leader is guaranteed to overlap with the write quorum of the previous committed entry.

## 2. Leader Election State Machine
Time in Raft is partitioned into monotonically increasing **Terms** [13:00]:

1. **Follower** awaits heartbeats (\`AppendEntries\`) from the leader.
2. On timeout, increments \`currentTerm\`, becomes **Candidate**, votes for self, and dispatches \`RequestVote\`.
3. Wins election upon receiving $\\lfloor N/2 \\rfloor + 1$ votes, or steps down if any RPC carries a higher term.

## 3. Up-to-Date Log Comparison (Election Safety)
A voter rejects \`RequestVote\` unless the candidate's log is at least as up-to-date as its own [21:31]:

\`\`\`go
upToDate := args.LastLogTerm > myLastTerm ||
    (args.LastLogTerm == myLastTerm && args.LastLogIndex >= myLastIndex)
\`\`\`

## 4. Log Matching & Indirect Commit Rule
If two logs contain an entry with the same index and term, they are guaranteed identical up through that index [27:30]. Crucially, Raft leaders **never** commit prior-term entries solely by counting replicas—they only advance \`commitIndex\` for entries created in \`currentTerm\` [40:51].`,
    diagrams: [
      {
        id: 'diag_raft_states',
        title: 'Raft Server State Transitions',
        timestampSec: 780,
        description:
          'Lifecycle transitions between Follower, Candidate, and Leader driven by timeouts, majority quorums, and higher term discovery.',
        mermaidCode: `stateDiagram-v2
  [*] --> Follower: Boot / Restart
  Follower --> Candidate: Election timeout (no heartbeat)
  Candidate --> Candidate: Split vote timeout (new term)
  Candidate --> Leader: Receives majority votes
  Candidate --> Follower: Discovers higher term or valid leader
  Leader --> Follower: Discovers higher term`,
      },
      {
        id: 'diag_append_entries',
        title: 'AppendEntries Consistency Handshake',
        timestampSec: 1650,
        description:
          'Leader-to-Follower RPC sequence resolving divergent suffix logs via prevLogIndex rollback.',
        mermaidCode: `sequenceDiagram
  participant L as "Leader (Term 4)"
  participant F as "Follower (Stale Log)"
  L->>F: "AppendEntries(prevIdx=5, prevTerm=3)"
  F-->>L: "Success=false (Mismatch at idx 5)"
  Note over L: "Decrement nextIndex[F] to 4"
  L->>F: "AppendEntries(prevIdx=4, prevTerm=2, entries)"
  F-->>L: "Success=true (Overwrites conflicting suffix)"`,
      },
    ],
    codeBlocks: [
      {
        id: 'code_raft_vote',
        title: 'RequestVote RPC Handler (Go)',
        language: 'go',
        timestampSec: 1291,
        explanation:
          'Enforces single-vote-per-term persistence and the Log Completeness check before granting a vote.',
        code: `func (rf *Raft) RequestVote(args *RequestVoteArgs, reply *RequestVoteReply) {
    rf.mu.Lock()
    defer rf.mu.Unlock()

    if args.Term < rf.currentTerm {
        reply.Term = rf.currentTerm
        reply.VoteGranted = false
        return
    }
    if args.Term > rf.currentTerm {
        rf.becomeFollower(args.Term)
    }

    lastIdx := len(rf.log) - 1
    lastTerm := rf.log[lastIdx].Term
    upToDate := args.LastLogTerm > lastTerm ||
        (args.LastLogTerm == lastTerm && args.LastLogIndex >= lastIdx)

    if (rf.votedFor == -1 || rf.votedFor == args.CandidateId) && upToDate {
        rf.votedFor = args.CandidateId
        rf.persist()
        rf.resetElectionTimer()
        reply.VoteGranted = true
    } else {
        reply.VoteGranted = false
    }
    reply.Term = rf.currentTerm
}`,
      },
    ],
    mathFormulas: [
      {
        id: 'math_quorum',
        title: 'Majority Quorum Intersection Invariant',
        timestampSec: 421,
        latex:
          '|Q_1| \\ge \\left\\lfloor \\frac{N}{2} \\right\\rfloor + 1, \\quad |Q_1 \\cap Q_2| \\ge |Q_1| + |Q_2| - N \\ge 1',
        variables: [
          { symbol: 'N', meaning: 'Total cluster servers (typically odd: 3, 5, 7)' },
          { symbol: 'Q_1, Q_2', meaning: 'Any two majority quorums (e.g., commit vs election)' },
        ],
        intuition:
          'Guarantees that any newly elected leader shares at least one server with every previously committed write quorum.',
      },
      {
        id: 'math_liveness',
        title: 'Randomized Split-Vote Resolution',
        timestampSec: 780,
        latex:
          '\\text{BroadcastTime} \\ll \\text{ElectionTimeout} \\sim \\mathcal{U}(150\\text{ms}, 300\\text{ms}) \\ll \\text{MTBF}',
        variables: [
          { symbol: '\\text{BroadcastTime}', meaning: 'Average RPC round-trip to all peers (~0.5–20ms)' },
          { symbol: '\\text{MTBF}', meaning: 'Mean time between hardware/process failures' },
        ],
        intuition:
          'Election timeouts must exceed RPC latency by an order of magnitude so leaders establish authority via heartbeats before followers time out.',
      },
    ],
    flashcards: [
      {
        id: 'rfc_1',
        topic: 'Election Safety',
        timestampSec: 1291,
        front: 'What two conditions must hold for a Raft server to grant its vote in RequestVote?',
        back: '1) The candidate’s term >= currentTerm and the server has not yet voted in that term (or already voted for that same candidate). 2) The candidate’s log is at least as up-to-date as the voter’s log.',
      },
      {
        id: 'rfc_2',
        topic: 'Commit Safety',
        timestampSec: 2451,
        front: 'Why can a Raft leader NOT directly commit log entries from a previous term even if stored on a majority?',
        back: 'A future leader could overwrite a previous-term entry unless a current-term entry is first committed on a majority, locking in the prefix via the Log Matching Property (Figure 8 anomaly).',
      },
      {
        id: 'rfc_3',
        topic: 'Log Replication',
        timestampSec: 1650,
        front: 'What does a Leader do when a Follower rejects AppendEntries due to a prevLogIndex mismatch?',
        back: 'The Leader decrements nextIndex[follower] (or jumps back by conflictTerm) and retries AppendEntries until finding the latest matching prefix.',
      },
      {
        id: 'rfc_4',
        topic: 'Fault Tolerance',
        timestampSec: 421,
        front: 'How many nodes are needed in Raft to tolerate f simultaneous crash failures?',
        back: '2f + 1 nodes (e.g., 5 nodes tolerate f = 2 failures while preserving a majority quorum of 3).',
      },
    ],
    quizQuestions: [
      {
        id: 'rq1',
        difficulty: 'Core',
        timestampSec: 421,
        question:
          'A 5-node Raft cluster experiences a network partition splitting nodes into {A, B} and {C, D, E}. Which side can elect a leader and commit new writes?',
        options: [
          'Both sides can elect independent leaders',
          'Only {C, D, E} because 3 >= floor(5/2) + 1',
          'Neither side until all 5 nodes reconnect',
          'Only {A, B} if node A was the previous leader',
        ],
        correctIndex: 1,
        explanation:
          'Only {C, D, E} holds a strict majority quorum of 3 out of 5 nodes. {A, B} cannot collect 3 votes.',
      },
      {
        id: 'rq2',
        difficulty: 'Deep',
        timestampSec: 1291,
        question:
          'Server S1 has lastLogTerm=4, lastLogIndex=10. Candidate C has lastLogTerm=5, lastLogIndex=6. Should S1 consider C’s log at least as up-to-date?',
        options: [
          'No, because S1 has a longer log (10 > 6)',
          'Yes, because C has a higher lastLogTerm (5 > 4)',
          'Only if C already holds 2 other votes',
          'No, Raft compares log index before term',
        ],
        correctIndex: 1,
        explanation:
          'Raft compares lastLogTerm first; only when lastLogTerm is equal does it compare lastLogIndex.',
      },
      {
        id: 'rq3',
        difficulty: 'Applied',
        timestampSec: 1650,
        question:
          'What happens if a Follower crashes and restarts with a higher stale local vote in memory, forgetting whom it voted for?',
        options: [
          'Nothing—votedFor does not affect safety',
          'Two candidates could win majorities in the same term (split brain)',
          'The leader automatically resets its term to 0',
          'Clients read stale state from followers safely',
        ],
        correctIndex: 1,
        explanation:
          'currentTerm, votedFor, and log[] MUST be persisted to stable storage before responding to RPCs so a rebooted node cannot vote twice in the same term.',
      },
    ],
  },
  {
    id: 'lec_bplus_trees',
    title: 'B+ Trees, Page Splits & Buffer Pool Internals',
    courseCode: 'CS 186',
    instructor: 'Prof. Priya Nair',
    domain: 'Database Systems',
    durationSec: 2325,
    sourceType: 'demo-slides',
    createdAt: '2026-10-22T09:15:00.000Z',
    summary:
      'Explains why disk/NVMe page alignment dictates B+ Tree fanout over binary search trees, walks through leaf and internal node split mechanics, and derives I/O cost bounds.',
    keyTakeaways: [
      'B+ Trees store record payloads/RIDs exclusively in leaf pages, maximizing internal node fanout.',
      'Doubly-linked leaf pages enable O(log_B N + K/B) sequential range scans without re-traversing the tree.',
      'Leaf splits copy the separator key upward; internal node splits push the middle key upward.',
      'Buffer pool pin counts and dirty bits coordinate latch crabbing and page eviction.',
    ],
    slides: [
      {
        index: 0,
        startSec: 0,
        title: 'Why Disk Blocks Need High Fanout',
        subtitle: '4KB–16KB OS Pages vs Cache-Miss Binary Trees',
        visualType: 'bplus-tree',
        highlights: [
          'Height of B+ tree with fanout F=200 for 100M keys is just 4',
          'Top 2–3 levels stay hot in the Buffer Pool',
          'Zero values stored in internal routing nodes',
        ],
        formulaLatex: 'h \\le \\lceil \\log_{\\lceil F/2 \\rceil}(N) \\rceil',
      },
      {
        index: 1,
        startSec: 840,
        title: 'Leaf Page Split vs Internal Node Split',
        subtitle: 'Copy-up vs Push-up separator key semantics',
        visualType: 'bplus-tree',
        highlights: [
          'Leaf overflow allocates new sibling leaf & links next pointer',
          'Smallest key of right leaf is COPIED into parent',
          'Internal overflow PUSHES middle key into parent',
        ],
      },
    ],
    transcript: [
      {
        id: 'bt1',
        startSec: 0,
        endSec: 450,
        speaker: 'Prof. Nair',
        slideIndex: 0,
        tags: ['definition', 'formula'],
        text: 'If you index 100 million rows in a balanced binary search tree, height is ~27, meaning 27 random page reads per lookup. By packing 200 keys into a single 8KB B+ Tree page, height collapses to 4!',
      },
      {
        id: 'bt2',
        startSec: 451,
        endSec: 839,
        speaker: 'Prof. Nair',
        slideIndex: 0,
        tags: ['diagram'],
        text: 'Notice the crucial difference between a classic B-Tree and a B+ Tree: internal nodes hold only routing keys and child PageIDs. All tuple pointers live in the linked leaf layer, giving us huge fanout and fast range scans.',
      },
      {
        id: 'bt3',
        startSec: 840,
        endSec: 1580,
        speaker: 'Prof. Nair',
        slideIndex: 1,
        tags: ['code', 'diagram'],
        text: 'When a leaf page reaches capacity 2d and a new key arrives, we split it into two leaves of size d and d+1, stitch the leaf next_page_id pointers, and COPY the first key of the new right leaf up into the parent.',
      },
      {
        id: 'bt4',
        startSec: 1581,
        endSec: 2325,
        speaker: 'Prof. Nair',
        slideIndex: 1,
        tags: ['code'],
        text: 'Contrast that with splitting an internal node: when an internal node overflows, we PUSH the middle key up—it does not remain duplicated in either child.',
      },
    ],
    notesMarkdown: `## 1. Page Alignment & Fanout Economics
Storage engines read and write fixed-size **4 KB – 16 KB pages** [00:00]. A B+ Tree aligns every node to one page so each tree level costs at most one I/O:

$$\\text{I/O Cost} = O(\\log_F N) + \\text{RangeScan}\\left(\\frac{K}{B}\\right)$$

With fanout $F = 200$ and $N = 10^8$ keys, tree height is only **4 levels**—and the root + level 1 stay pinned in the Buffer Pool RAM [07:31].

## 2. Copy-Up (Leaf) vs Push-Up (Internal) Splits
- **Leaf Split** [14:00]: Split keys evenly across old and new leaf pages, update \`next_leaf_id\`, and **copy** the lowest key of the right leaf upward into the parent.
- **Internal Split** [26:21]: Move upper half of keys/children to a new internal page and **push** the median routing key upward so it does not repeat below.

\`\`\`rust
if leaf.is_full() {
    let split_key = leaf.split_into(&mut right_leaf);
    right_leaf.next = leaf.next;
    leaf.next = Some(right_leaf.page_id);
    parent.insert_separator(split_key, right_leaf.page_id); // Copy-up
}
\`\`\``,
    diagrams: [
      {
        id: 'diag_bplus_layout',
        title: 'B+ Tree Routing & Doubly-Linked Leaf Layer',
        timestampSec: 451,
        description:
          'Internal index pages store routing keys only; leaf pages hold sorted key-RID pairs linked for fast range scans.',
        mermaidCode: `flowchart TD
  R["Root Page [50 | 120]"] --> I1["Internal [15 | 30]"]
  R --> I2["Internal [80]"]
  R --> I3["Internal [150]"]
  I1 --> L1["Leaf [5, 10]"]
  I1 --> L2["Leaf [15, 22]"]
  I2 --> L3["Leaf [50, 75]"]
  I3 --> L4["Leaf [120, 145]"]
  L1 <--> L2
  L2 <--> L3
  L3 <--> L4`,
      },
    ],
    codeBlocks: [
      {
        id: 'code_bplus_split',
        title: 'Leaf Page Binary Search & Split (Rust)',
        language: 'rust',
        timestampSec: 840,
        explanation:
          'Searches sorted keys in-page using binary search and splits an overflowing leaf page while maintaining sibling linkage.',
        code: `pub struct LeafPage {
    pub page_id: u32,
    pub next_page_id: Option<u32>,
    pub entries: Vec<(i64, u64)>, // (key, record_id)
}

impl LeafPage {
    pub fn split(&mut self, new_page_id: u32) -> (i64, LeafPage) {
        let mid = self.entries.len() / 2;
        let right_entries = self.entries.split_off(mid);
        let copy_up_key = right_entries[0].0;

        let right = LeafPage {
            page_id: new_page_id,
            next_page_id: self.next_page_id,
            entries: right_entries,
        };
        self.next_page_id = Some(new_page_id);
        (copy_up_key, right)
    }
}`,
      },
    ],
    mathFormulas: [
      {
        id: 'math_bplus_height',
        title: 'Worst-Case B+ Tree Height Bound',
        timestampSec: 0,
        latex: 'h \\le \\left\\lceil \\log_{\\lceil F/2 \\rceil}\\left(\\frac{N}{L}\\right) \\right\\rceil + 1',
        variables: [
          { symbol: 'F', meaning: 'Maximum internal node fanout (pointers per page)' },
          { symbol: 'L', meaning: 'Minimum entries per leaf page (at least floor(C/2))' },
          { symbol: 'N', meaning: 'Total indexed keys in the table' },
        ],
        intuition:
          'Even at minimum 50% occupancy across every page, logarithmic base F/2 keeps height <= 4 for hundreds of millions of rows.',
      },
    ],
    flashcards: [
      {
        id: 'bfc_1',
        topic: 'Node Architecture',
        timestampSec: 451,
        front: 'Why do B+ Trees outperform standard B-Trees for range queries and fanout?',
        back: 'Internal nodes omit record payloads/RIDs, fitting far more routing keys per 8KB page (shorter height), and all leaves are linked sequentially for scan-without-backtracking.',
      },
      {
        id: 'bfc_2',
        topic: 'Split Semantics',
        timestampSec: 840,
        front: 'What is the difference between a B+ Tree leaf split and an internal node split?',
        back: 'A leaf split COPIES the middle/first-right key into the parent so the key stays in the leaf; an internal split PUSHES the middle key into the parent without keeping a duplicate.',
      },
    ],
    quizQuestions: [
      {
        id: 'bq1',
        difficulty: 'Core',
        timestampSec: 840,
        question:
          'When splitting a B+ Tree leaf page containing keys [10, 20, 30, 40] upon inserting 25, what happens to the separator key?',
        options: [
          '25 is removed from both leaves and pushed to the parent',
          '25 (or 30) is copied to the parent while still remaining in the right leaf',
          'All four keys are duplicated into the root node',
          'The parent page is deleted and recreated',
        ],
        correctIndex: 1,
        explanation:
          'B+ Tree leaves must retain every indexed key and its RID, so leaf splits copy the first key of the right sibling upward.',
      },
    ],
  },
];
