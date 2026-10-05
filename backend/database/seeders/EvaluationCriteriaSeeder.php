<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EvaluationCriterion;

class EvaluationCriteriaSeeder extends Seeder
{
    public function run(): void
    {
        $criteria = [
            [
                'name'        => 'Methodology',
                'instruction' => "Critically evaluate the research methodology design. 
1. Identify whether the approach (qualitative, quantitative, or mixed) is appropriate to answer the research questions.
2. Examine the details of the experimental design or data collection methods. Are there any methodological biases?
3. Evaluate whether the chosen data analysis methods align with the relevant scientific standards.
Provide an in-depth assessment and point out any flaws if the employed methods lack rigorous justification.",
                'weight'      => 20,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => true,
            ],
            [
                'name'        => 'Novelty & Significance',
                'instruction' => "Analyze the novelty and scientific contribution of this paper.
1. Is the addressed problem genuinely novel, or merely a replication of previous studies?
2. Evaluate the 'State of the Art': Has the author clearly established the research gap in the introduction or literature review?
3. How significant are the findings to the advancement of knowledge or practical applications in the field?
Strictly assess whether the contribution merits publication in a high-impact journal.",
                'weight'      => 15,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => false,
            ],
            [
                'name'        => 'Evidence & Data Rigor',
                'instruction' => "Conduct a rigorous validation of the data quality (Data Rigor) and empirical evidence presented.
1. Check the validity and reliability of the data collection instruments. Is the sample size statistically adequate?
2. Evaluate data presentation: Are tables, graphs, and testing metrics presented transparently and logically?
3. Are the author's conclusions genuinely supported by the empirical evidence, or do they appear overstated (overclaiming)?
Flag any claims that lack robust data support.",
                'weight'      => 15,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => true,
            ],
            [
                'name'        => 'Clarity & Writing',
                'instruction' => "Assess the quality of manuscript presentation, logical flow, and writing structure.
1. Are the main ideas conveyed sequentially and easily understood by academic readers?
2. Check adherence to standard scientific paper structures (IMRAD: Introduction, Methods, Results, And Discussion).
3. Evaluate academic grammar conventions: Are there redundancies, ambiguities, or inappropriate use of technical jargon?
Provide specific feedback on confusing paragraphs or sections.",
                'weight'      => 15,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => false,
            ],
            [
                'name'        => 'References & Citations',
                'instruction' => "Conduct a comprehensive audit of the bibliography and citations.
1. Check the relevance and recency of references: Is the cited literature dominated by journals from the last 5-10 years?
2. Evaluate the consistency between in-text citations and the bibliography at the end of the manuscript.
3. Detect potential citation anomalies: Are there indications of citation manipulation (e.g., excessive self-citation or citing sources irrelevant to the context)?",
                'weight'      => 10,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => false,
                'is_qa'       => false,
            ],
            [
                'name'        => 'Reproducibility',
                'instruction' => "Evaluate how easily the research can be replicated by other researchers.
1. Are the experimental procedures, algorithms, or protocols described in sufficient detail for independent reproduction?
2. For computational research: Are hyperparameters, hardware specs, dataset links, and source code availability clearly stated?
3. For empirical research: Are sampling procedures, instrument calibration, and data collection steps documented transparently?
Highlight any missing information that would prevent successful replication.",
                'weight'      => 15,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => true,
                'is_qa'       => false,
            ],
            [
                'name'        => 'Writing Quality',
                'instruction' => "Evaluate the overall quality of academic writing and language proficiency.
1. Assess grammar, spelling, punctuation, and sentence structure for academic standards.
2. Check for consistency in terminology, abbreviations, and formatting throughout the manuscript.
3. Evaluate whether figures, tables, and visual elements are properly labeled, referenced, and contribute meaningfully to the narrative.
Flag sections with unclear phrasing or poor readability.",
                'weight'      => 10,
                'is_active'   => true,
                'is_analyze'  => true,
                'is_review'   => false,
                'is_qa'       => false,
            ],
        ];

        foreach ($criteria as $criterion) {
            EvaluationCriterion::updateOrCreate(
                ['name' => $criterion['name']],
                $criterion
            );
        }
    }
}
