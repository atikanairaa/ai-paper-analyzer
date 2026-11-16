<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EvaluationCriterion;

class EvaluationCriteriaSeeder extends Seeder
{
    public function run(): void
    {
        $criteria = [
            // =========================================================================
            // 1. KATEGORI: ILMU KOMPUTER & INFORMATIKA
            // =========================================================================
            [
                'category'    => 'Ilmu Komputer & Informatika',
                'name'        => 'Algorithmic Complexity & Efficiency',
                'instruction' => "Critically evaluate the computational complexity and efficiency of the proposed algorithm:
1. Analyze both theoretical and empirical time and space complexity using formal Big-O notation.
2. Assess how the algorithm handles boundary conditions, edge cases, out-of-distribution inputs, and memory overhead.
3. Verify if formal mathematical convergence proofs or theoretical bounds are provided for new or optimized algorithms.",
                'weight'      => 25,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => true,
            ],
            [
                'category'    => 'Ilmu Komputer & Informatika',
                'name'        => 'Dataset Integrity & Preprocessing',
                'instruction' => "Audit dataset integrity and the feature engineering pipeline:
1. Verify whether train, validation, and test splits strictly prevent data leakage.
2. Evaluate mitigation strategies for class imbalance, missing values, outliers, and feature normalization.
3. For public datasets, verify proper citations and licensing; for newly constructed datasets, evaluate the objectivity of the ground-truth annotation protocol and inter-annotator agreement (e.g., Cohen's Kappa).",
                'weight'      => 20,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => false,
            ],
            [
                'category'    => 'Ilmu Komputer & Informatika',
                'name'        => 'Model Architecture & Benchmark Rigor',
                'instruction' => "Evaluate the rigor of empirical evaluation against state-of-the-art (SOTA) benchmarks:
1. Are the baseline models relevant, recent, and benchmarked on identical hardware and data splits for a fair comparison?
2. Are comprehensive evaluation metrics reported (e.g., Accuracy, Precision, Recall, F1-Score, AUC-ROC, latency, throughput)?
3. Is an ablation study conducted to substantiate the individual contribution of each proposed architectural module or loss term?",
                'weight'      => 25,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => true,
            ],
            [
                'category'    => 'Ilmu Komputer & Informatika',
                'name'        => 'Reproducibility & Open Source Artifacts',
                'instruction' => "Examine the transparency and availability of computational artifacts for replication:
1. Is a publicly accessible code repository provided (e.g., GitHub/GitLab with an active link)?
2. Are all hyperparameters, random seeds, hardware specifications (GPU/TPU/CPU), and runtime dependencies (requirements.txt/Dockerfile) comprehensively documented?
3. Are pre-trained model weights, checkpoints, or processed datasets made available for independent verification?",
                'weight'      => 15,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => false,
            ],
            [
                'category'    => 'Ilmu Komputer & Informatika',
                'name'        => 'System Architecture & Scalability',
                'instruction' => "Evaluate the software engineering design and architectural scalability:
1. Analyze system modularity, clean architectural separation of concerns (e.g., Clean Architecture, Microservices), and I/O efficiency.
2. Evaluate system resiliency and degradation behavior as data scale or user concurrency increases exponentially.
3. Assess deployment feasibility and readiness for production or edge-device environments.",
                'weight'      => 15,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => false,
            ],

            // =========================================================================
            // 2. KATEGORI: EKONOMI & BISNIS
            // =========================================================================
            [
                'category'    => 'Ekonomi & Bisnis',
                'name'        => 'Theoretical Foundation & Literature Gap',
                'instruction' => "Evaluate the theoretical grounding and contextual motivation:
1. Are hypotheses solidly grounded in established economic or managerial theories (e.g., Agency Theory, Resource-Based View, Signaling Theory)?
2. Is the research gap sharply differentiated from existing empirical literature and industry dynamics?
3. Is the conceptual framework coherent in connecting independent, mediating/moderating, and dependent variables?",
                'weight'      => 20,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => true,
            ],
            [
                'category'    => 'Ekonomi & Bisnis',
                'name'        => 'Econometric & Empirical Modeling',
                'instruction' => "Conduct a rigorous audit of the econometric model specification:
1. Is the chosen regression methodology appropriate (e.g., OLS, Fixed/Random Effects Panel Data, Difference-in-Differences, SEM-PLS)?
2. Are classical regression assumptions and diagnostic tests satisfied (multicollinearity, heteroskedasticity, serial correlation)?
3. How effectively are endogeneity issues and reverse causality addressed (e.g., using Instrumental Variables/2SLS, GMM, or natural experiments)?",
                'weight'      => 30,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => true,
            ],
            [
                'category'    => 'Ekonomi & Bisnis',
                'name'        => 'Data Quality & Market Validity',
                'instruction' => "Evaluate empirical data reliability and market validity:
1. Are secondary data sources credible and authoritative (e.g., Audited Financial Statements, Stock Exchanges/Bloomberg, World Bank, Central Banks)?
2. For survey-based research, are construct validity (convergent and discriminant) and composite reliability formally validated?
3. Does the sample period appropriately represent normal market conditions or account for structural breaks and crisis periods?",
                'weight'      => 25,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => false,
            ],
            [
                'category'    => 'Ekonomi & Bisnis',
                'name'        => 'Managerial & Policy Implications',
                'instruction' => "Assess actionable practical relevance for decision-makers:
1. Does the study offer concrete, evidence-based recommendations for corporate executives or economic policymakers (fiscal/monetary)?
2. Are cost-benefit trade-offs, implementation feasibility, and market risks realistically discussed?
3. Are study limitations and boundaries of generalizability transparently acknowledged?",
                'weight'      => 25,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => false,
            ],
        ];

        foreach ($criteria as $criterion) {
            EvaluationCriterion::updateOrCreate(
                [
                    'category' => $criterion['category'],
                    'name'     => $criterion['name'],
                ],
                $criterion
            );
        }
    }
}
