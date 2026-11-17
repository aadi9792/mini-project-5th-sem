"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowLeft, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { BasicInfoStep, BasicInfoData } from "./steps/BasicInfoStep";
import { QuestionStep, QuestionConfig } from "./steps/QuestionStep";
import { ReviewStep } from "./steps/ReviewStep";
import { childrenClient } from "@/lib/children/childrenClient";

const ALL_QUESTIONS: QuestionConfig[] = [
  // Step 2
  {
    id: "q1Sound",
    question: "How does {nickname} usually react to sudden or loud sounds?",
    type: "single-select",
    options: [
      { value: "not_bothered", label: "Not bothered" },
      { value: "mildly_sensitive", label: "Mildly sensitive" },
      { value: "very_sensitive", label: "Very sensitive, prefers quiet" },
    ],
  },
  {
    id: "q2Motion",
    question: "How does {nickname} respond to fast movement or busy/flashing visuals?",
    type: "single-select",
    options: [
      { value: "enjoys_motion", label: "Enjoys lots of motion" },
      { value: "moderate_motion", label: "Fine with moderate motion" },
      { value: "prefers_calm", label: "Prefers calm, minimal motion" },
    ],
  },
  // Step 3
  {
    id: "q3Transitions",
    question: "How does {nickname} usually handle switching between activities?",
    type: "single-select",
    options: [
      { value: "transitions_easily", label: "Transitions easily" },
      { value: "needs_warning", label: "Needs a little warning" },
      { value: "needs_countdown", label: "Finds it hard, needs clear countdowns" },
    ],
  },
  {
    id: "q4AttentionSpan",
    question: "How long can {nickname} usually focus before needing a break?",
    type: "single-select",
    options: [
      { value: "under_3", label: "Under 3 minutes" },
      { value: "3_to_7", label: "3–7 minutes" },
      { value: "7_to_15", label: "7–15 minutes" },
      { value: "15_plus", label: "15+ minutes" },
    ],
  },
  // Step 4
  {
    id: "q5SocialComfort",
    question: "How comfortable is {nickname} starting conversations or interacting with new characters?",
    type: "single-select",
    options: [
      { value: "very_comfortable", label: "Very comfortable" },
      { value: "somewhat_shy", label: "Somewhat shy" },
      { value: "observes_first", label: "Prefers to observe first" },
    ],
  },
  {
    id: "q6RegulationStrategy",
    question: "When {nickname} gets frustrated, what tends to help most?",
    type: "multi-select",
    minSelect: 1,
    options: [
      { value: "quiet_time", label: "Quiet time alone" },
      { value: "breathing", label: "Breathing or calming activity" },
      { value: "trusted_adult", label: "Talking to a trusted adult" },
      { value: "movement", label: "Movement" },
      { value: "not_sure", label: "Not sure yet" },
    ],
  },
  // Step 5
  {
    id: "q7CheckInStyle",
    question: "Should the app gently check in on {nickname}'s mood sometimes, or only when they ask?",
    type: "single-select",
    options: [
      { value: "gentle_checkins", label: "Gentle occasional check-ins" },
      { value: "only_when_asked", label: "Only when they ask" },
    ],
  },
  {
    id: "q8InstructionStyle",
    question: "How does {nickname} prefer instructions?",
    type: "single-select",
    options: [
      { value: "icons_only", label: "Mostly pictures/icons" },
      { value: "icons_plus_text", label: "Mix of pictures and short text" },
      { value: "short_sentences", label: "Short sentences" },
      { value: "longer_text", label: "Longer text" },
    ],
  },
  // Step 6
  {
    id: "q9GuidanceNeeded",
    question: "When learning something new, how much guidance does {nickname} need?",
    type: "single-select",
    options: [
      { value: "independent", label: "Jumps in independently" },
      { value: "a_few_prompts", label: "A few prompts help" },
      { value: "step_by_step", label: "Needs step-by-step guidance" },
    ],
  },
  {
    id: "q10Predictability",
    question: "Does {nickname} feel calmer knowing exactly what's coming next?",
    type: "single-select",
    options: [
      { value: "really_helps", label: "Yes, really helps" },
      { value: "somewhat", label: "Somewhat" },
      { value: "not_major", label: "Not a major factor" },
    ],
  },
  // Step 7
  {
    id: "q11Motor",
    question: "Does {nickname} find small, precise taps or drag gestures difficult?",
    type: "single-select",
    options: [
      { value: "no_difficulty", label: "No difficulty" },
      { value: "some_difficulty", label: "Some difficulty, bigger buttons help" },
      { value: "significant_difficulty", label: "Significant difficulty" },
    ],
  },
  {
    id: "q12FirstFocusArea",
    question: "Which would you like Skillverse to help with first?",
    type: "multi-select",
    minSelect: 1,
    maxSelect: 2,
    limitMessage: "Pick up to 2.",
    options: [
      { value: "time", label: "Time & transitions" },
      { value: "feelings", label: "Big feelings & meltdowns" },
      { value: "faces", label: "Reading faces & social cues" },
    ],
  },
];

export default function CreateProfileWizardPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [returnToReview, setReturnToReview] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Saved child id in case step 2 of submission needs retry (02 §4.3)
  const [persistedChildId, setPersistedChildId] = useState<string | null>(null);

  // Basic Info (Step 1)
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    nickname: "",
    age: "",
    interests: [],
  });

  // Questionnaire Answers (Steps 2-7)
  const [answers, setAnswers] = useState<Record<string, any>>({
    q1Sound: "",
    q2Motion: "",
    q3Transitions: "",
    q4AttentionSpan: "",
    q5SocialComfort: "",
    q6RegulationStrategy: [],
    q7CheckInStyle: "",
    q8InstructionStyle: "",
    q9GuidanceNeeded: "",
    q10Predictability: "",
    q11Motor: "",
    q12FirstFocusArea: [],
  });

  // Check if current user already has a child; if so redirect
  useEffect(() => {
    childrenClient.getMyChild().then((state) => {
      if (state?.child) {
        if (!state.tutorialCompleted) {
          router.replace("/handoff");
        } else {
          router.replace("/continue-as");
        }
      }
    });
  }, [router]);

  const handleBasicInfoChange = (updates: Partial<BasicInfoData>) => {
    setBasicInfo((prev) => ({ ...prev, ...updates }));
    setSubmitError("");
  };

  const handleAnswerChange = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitError("");
  };

  // Validation per step
  const isCurrentStepValid = (): boolean => {
    if (currentStep === 1) {
      const trimmed = basicInfo.nickname.trim();
      const validName = trimmed.length >= 2 && trimmed.length <= 20;
      const validAge = typeof basicInfo.age === "number" && basicInfo.age >= 6 && basicInfo.age <= 17;
      const validInterests = basicInfo.interests.length >= 1 && basicInfo.interests.length <= 5;
      return validName && validAge && validInterests;
    }

    if (currentStep >= 2 && currentStep <= 7) {
      const stepQuestions = getQuestionsForStep(currentStep);
      return stepQuestions.every((q) => {
        const val = answers[q.id];
        if (q.type === "single-select") {
          return !!val;
        } else {
          const arr = Array.isArray(val) ? val : [];
          return arr.length >= (q.minSelect || 1);
        }
      });
    }

    return true; // Step 8 is review
  };

  const getQuestionsForStep = (step: number): QuestionConfig[] => {
    switch (step) {
      case 2:
        return [ALL_QUESTIONS[0], ALL_QUESTIONS[1]];
      case 3:
        return [ALL_QUESTIONS[2], ALL_QUESTIONS[3]];
      case 4:
        return [ALL_QUESTIONS[4], ALL_QUESTIONS[5]];
      case 5:
        return [ALL_QUESTIONS[6], ALL_QUESTIONS[7]];
      case 6:
        return [ALL_QUESTIONS[8], ALL_QUESTIONS[9]];
      case 7:
        return [ALL_QUESTIONS[10], ALL_QUESTIONS[11]];
      default:
        return [];
    }
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      setShowErrors(true);
      return;
    }

    setShowErrors(false);

    if (returnToReview) {
      setReturnToReview(false);
      setCurrentStep(8);
      return;
    }

    if (currentStep < 8) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setShowErrors(false);
    if (returnToReview) {
      setReturnToReview(false);
      setCurrentStep(8);
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleEditFromReview = (stepNumber: number) => {
    setShowErrors(false);
    setReturnToReview(true);
    setCurrentStep(stepNumber);
  };

  // Final Step 8 Submit: Sequential calls with partial failure handling per §4.3
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    let childId = persistedChildId;

    try {
      // 1. Create Child (only if not already created during a previous failed attempt)
      if (!childId) {
        const childRes = await childrenClient.createChild({
          nickname: basicInfo.nickname.trim(),
          age: Number(basicInfo.age),
          interests: basicInfo.interests,
        });
        childId = childRes.child.id;
        setPersistedChildId(childId);
      }

      // 2. Submit Preferences using the returned childId
      await childrenClient.createPreferences(childId, {
        q1Sound: answers.q1Sound,
        q2Motion: answers.q2Motion,
        q3Transitions: answers.q3Transitions,
        q4AttentionSpan: answers.q4AttentionSpan,
        q5SocialComfort: answers.q5SocialComfort,
        q6RegulationStrategy: answers.q6RegulationStrategy,
        q7CheckInStyle: answers.q7CheckInStyle,
        q8InstructionStyle: answers.q8InstructionStyle,
        q9GuidanceNeeded: answers.q9GuidanceNeeded,
        q10Predictability: answers.q10Predictability,
        q11Motor: answers.q11Motor,
        q12FirstFocusArea: answers.q12FirstFocusArea,
      });

      // Complete! Proceed into Tutorial Island (Step 1: Handoff)
      router.push("/handoff");
    } catch (err: any) {
      setSubmitError(
        err.message || "Something went wrong while setting up the profile. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Screen Reader Step Announcement */}
      <div className="sr-only" aria-live="polite">
        Step {currentStep} of 8
      </div>

      {/* Progress Dots Header (§3.1) */}
      <div className="flex flex-col items-center mb-6">
        <span className="text-[12px] font-bold text-[var(--sv-primary-deep)] uppercase tracking-wider mb-2">
          Step {currentStep} of 8
        </span>

        <div className="flex items-center gap-2">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => {
            const isCompleted = s < currentStep;
            const isCurrent = s === currentStep;

            if (isCompleted) {
              return (
                <div
                  key={s}
                  className="w-5 h-5 rounded-full bg-[var(--sv-primary-deep)] text-white flex items-center justify-center text-[10px]"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              );
            }

            if (isCurrent) {
              return (
                <div
                  key={s}
                  className="w-6 h-6 rounded-full bg-[var(--sv-primary)] ring-4 ring-[var(--sv-primary)]/20 flex items-center justify-center"
                />
              );
            }

            return (
              <div
                key={s}
                className="w-5 h-5 rounded-full border-2 border-[var(--sv-text-soft)]/30"
              />
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <BasicInfoStep
            data={basicInfo}
            onChange={handleBasicInfoChange}
            showErrors={showErrors}
          />
        )}

        {currentStep >= 2 && currentStep <= 7 && (
          <QuestionStep
            nickname={basicInfo.nickname}
            questions={getQuestionsForStep(currentStep)}
            answers={answers}
            onChange={handleAnswerChange}
            showErrors={showErrors}
          />
        )}

        {currentStep === 8 && (
          <ReviewStep
            basicInfo={basicInfo}
            preferences={answers}
            questionConfigs={ALL_QUESTIONS}
            onEditStep={handleEditFromReview}
          />
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="mt-4 p-3 rounded-xl bg-[var(--sv-warning)]/15 border border-[var(--sv-warning)]/30 text-[var(--sv-text)] text-[13px] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--sv-warning)] shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 pt-4 border-t border-[var(--sv-text-soft)]/15 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="h-11 px-5 rounded-full border border-[var(--sv-text-soft)]/25 text-[var(--sv-text)] font-semibold text-[14px] hover:border-[var(--sv-primary)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 8 ? (
          <button
            type="button"
            onClick={handleNext}
            className="h-11 px-6 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[14px] hover:brightness-105 active:scale-[0.99] flex items-center gap-2 transition-all shadow-md cursor-pointer ml-auto"
          >
            <span>{returnToReview ? "Save & Return" : "Next"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[15px] sm:text-[16px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Setting up adventure...</span>
              </>
            ) : (
              <span>Let&apos;s set up {basicInfo.nickname}&apos;s adventure!</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

