import { storage, useLocal } from "./storage";
import { sift, sort } from "radash";
import { useEffect, useMemo, useState } from "react";

export const useJobs = () => {
  const [jobs, setJobs] = useState({});
  const [jobIds] = useLocal("jobs_ids");

  useEffect(() => {
    const keys = jobIds || [];

    const listeners = {};
    keys.forEach((id) => {
      const key = 'job_' + id;
      listeners[key] = async (c) => {
        setJobs((old) => ({ ...old, [id]: c.newValue }));
      };
    });

    storage.watch(listeners);
    return () => storage.unwatch(listeners);
  }, []);

  return useMemo(() => {
    const sortedJobIds = sort(jobIds || [], (it) => parseInt(it), true);
    const sortedJobs = sortedJobIds.map((id) => jobs[id]);
    return sift(sortedJobs);
  }, [jobIds, jobs]);
};

export const useJob = (jobId) => {
  const [didInit, setDidInit] = useState();
  const [job, setJob] = useLocal('job_' + jobId, 'loading');
  const [result, setResult] = useState({ job: null, setJob, didInit: false });

  useEffect(() => {
    setResult({ job: null, setJob, didInit: false });
  }, [jobId]);

  useEffect(() => {
    if (jobId === undefined) {
      setResult({ job: null, setJob, didInit: true });
    } else if (job == 'loading') {
      setResult({ job: null, setJob, didInit: false });
    } else {
      setResult({ job, setJob, didInit: true });
    }
  }, [job]);

  return result;
};

export const useActiveJob = () => {
  const [activeId] = useLocal("activeId");
  return useJob(activeId);
};
