import { useLocal, storage } from "./storage.js";
import { useMemo, useEffect, useState } from "react";
import { getModel, getAvailableModels } from "../lib/ai.mjs";
import { getKey } from "../lib/store.mjs";
import { useRoundId } from "../lib/controller.mjs";
import OpenAI from "openai";
// import { storage } from "../../../lib/extension";

export const useOpenAiKey = () => {
  const [key, , { isLoading: keyIsLoading }] = useLocal("openAiKey");
  const [plan, , { isLoading: planIsLoading }] = useLocal("openAiPlan");
  const loading = keyIsLoading || planIsLoading;

  return { key, plan, loading };
};

export const useOpenAiModels = () => {
  const [model, setModel] = useState();
  const [available, setAvailable] = useState([]);
  const openai = useOpenAiKey();

  useEffect(() => {
    getAvailableModels().then(setAvailable);
    getModel().then(setModel);
  }, [openai.key]);

  return { model, available };
};

export const useUsage = () => {
  const roundId = useRoundId();
  const [usage] = useLocal("roundUsage_" + roundId);
  return usage || {};
};

export const useQuota = () => {
  const [quota, setQuota] = useState({ ok: true });
  const { key: openaiKey, plan: openaiPlan } = useOpenAiKey();
  const models = useOpenAiModels();

  useEffect(() => {
    if (!openaiKey) return;
    if (!models?.model) return;

    if (openaiPlan === "free") {
      setQuota({ credits: 1, ok: true });
      return;
    }

    const client = new OpenAI({
      apiKey: openaiKey,
      dangerouslyAllowBrowser: true,
    });

    // There's no endpoint for quota available, so just run
    // a test prompt
    client.chat.completions
      .create({
        model: models.model,
        messages: [{ role: "user", content: "test" }],
      })
      .then((resp) => {
        setQuota({ credits: 1, ok: true });
      })
      .catch((err) => {
        if (err.code === "insufficient_quota") {
          setQuota({ credits: 0, error: err, ok: false });
        } else {
          setQuota({ error: err, ok: false });
        }
      });
  }, [openaiPlan, openaiKey, models?.model]);

  return quota;
};
