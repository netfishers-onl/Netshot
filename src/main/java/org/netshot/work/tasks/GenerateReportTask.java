/*
 * Copyright Sylvain Cadilhac 2013
 */
package org.netshot.work.tasks;

import javax.persistence.Transient;

import org.netshot.work.Task;



/**
 * The Class GenerateReportTask.
 */
public class GenerateReportTask extends Task {

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#run()
	 */
	@Override
	public void run() {
		// TODO Auto-generated method stub
		
	}

	/* (non-Javadoc)
	 * @see org.netshot.work.Task#getTaskDescription()
	 */
	@Override
	@Transient
	public String getTaskDescription() {
		return "Report Generation";
	}

}
