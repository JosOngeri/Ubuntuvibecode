import React from 'react';
import { Link } from 'react-router-dom';
import { BsBriefcase, BsPeople, BsBuilding } from 'react-icons/bs';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      <nav className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-orange-600 dark:text-orange-400">
                Ubuntu HRMS
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Welcome to Ubuntu HRMS
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Streamline your HR operations with our comprehensive management system
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/recruitment/jobs-board"
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              View Job Opportunities
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 border border-orange-500 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 transition"
            >
              Employee Login
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <BsBriefcase className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Job Management
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Post and manage job openings, track applications, and streamline your recruitment
              process.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <BsPeople className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Employee Portal
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Access payslips, manage leave requests, and track performance all in one place.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <BsBuilding className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Admin Dashboard
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Comprehensive tools for payroll, attendance, KPIs, and organizational management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
